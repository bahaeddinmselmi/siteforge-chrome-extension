/* global chrome, importScripts */
importScripts('utils.js','schemaValidator.js','zip.js','builder.js','apiHandler.js','wordpress.js','wordpressTheme.js');
const U=self.SiteForgeUtils,API=self.SiteForgeAPI,Builder=self.SiteForgeBuilder,WP=self.SiteForgeWordPress,WPTheme=self.SiteForgeWordPressTheme;
function status(t){U.log(t);chrome.runtime.sendMessage({type:'SITEFORGE_STATUS',text:t});}
function err(t,raw){chrome.runtime.sendMessage({type:'SITEFORGE_ERROR',text:t,raw:raw||''});}
function activeTab(){return new Promise((res,rej)=>{chrome.tabs.query({active:true,currentWindow:true},tabs=>{if(chrome.runtime.lastError)return rej(chrome.runtime.lastError);if(!tabs||!tabs.length)return rej(new Error('no active tab'));res(tabs[0]);});});}
function capture(){return new Promise(r=>{chrome.tabs.captureVisibleTab(null,{format:'png'},d=>{if(chrome.runtime.lastError||!d)r({full:null,viewport:null});else r({full:d,viewport:d});});});}
function snapshot(tabId,shots){return new Promise((res,rej)=>{chrome.tabs.sendMessage(tabId,{type:'SITEFORGE_SNAPSHOT',screenshots:shots},reply=>{if(chrome.runtime.lastError)return rej(chrome.runtime.lastError);if(!reply||!reply.ok)return rej(new Error((reply&&reply.error)||'snapshot failed'));res(reply.snapshot);});});}
async function preview(){
  try{status('Scraping (preview)...');const tab=await activeTab(),shots=await capture(),snap=await snapshot(tab.id,shots);status('Snapshot ready.');chrome.runtime.sendMessage({type:'SITEFORGE_SNAPSHOT_PREVIEW',snapshot:snap});}
  catch(e){console.error(e);err('Preview failed: '+e.message);}
}
async function build(opts){
  opts=opts||{};
  let result=null;
  try{
    status('[10%] Scraping page...');
    const tab=await activeTab(),shots=await capture();
    status('[30%] Creating snapshot...');
    const snap=await snapshot(tab.id,shots);
    
    let filename='siteforge-export.zip';
    let buildMsg='Building project...';
    
    let zipBlob=null;
    
    if(opts.format==='wp-theme'){
      status('[50%] Building WordPress theme...');
      const wpFiles=WPTheme.buildWordPressTheme(snap);
      const project={name:snap.title||'siteforge-theme',version:'1.0.0',packageManager:'npm',files:[],assets:[]};
      Object.keys(wpFiles).forEach(p=>{project.files.push({path:p,content:wpFiles[p]});});
      zipBlob=await Builder.buildProjectZip(project);
      filename='siteforge-wp-theme.zip';
    }else if(opts.multiPage){
      status('[50%] Crawling all pages...');
      const pages=await new Promise((res,rej)=>{chrome.tabs.sendMessage(tab.id,{type:'SITEFORGE_CRAWL_PAGES',maxPages:20},reply=>{if(chrome.runtime.lastError)return rej(chrome.runtime.lastError);if(!reply||!reply.ok)return rej(new Error((reply&&reply.error)||'crawl failed'));res(reply.pages||[]);});});
      status('[60%] Building multi-page Next.js app from '+pages.length+' crawled page'+(pages.length===1?'':'s')+'...');
      result=await Builder.buildStaticCopyZip({...snap,pages});
      zipBlob=result.blob;
      filename='siteforge-multipage.zip';
    }else{
      status('[50%] Building static Next.js copy (no AI)...');
      result=await Builder.buildStaticCopyZip(snap);
      zipBlob=result.blob;
      filename='siteforge-next-app.zip';
    }
    
    status('[80%] ✓ Project ZIP created');
    status('[85%] Starting download...');
    const reader=new FileReader();
    reader.onload=()=>{
      const dataUrl=reader.result;
      chrome.downloads.download({url:dataUrl,filename:filename,saveAs:false},()=>{
        if(chrome.runtime.lastError)err('Download error: '+chrome.runtime.lastError.message);
        else{
          status('[90%] ✓ Download started');
          status('[95%] 📁 Location: Your Downloads folder / '+filename);
          status('[100%] ✓ COMPLETED: Ready to use!');
          if(opts.deploy==='vercel'){
            setTimeout(()=>{deployToVercel(zipBlob);},1000);
          }
        }
      });
    };
    reader.readAsDataURL(zipBlob);
  }
  catch(e){console.error(e);err('Build failed: '+e.message);}
}
async function deployToVercel(zipBlob){
  try{
    status('[85%] Preparing Vercel deployment...');
    const formData=new FormData();
    formData.append('file',zipBlob,'siteforge-export.zip');
    
    const res=await fetch('https://api.vercel.com/v13/deployments',{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+localStorage.getItem('vercel_token')||''
      },
      body:formData
    });
    
    if(res.ok){
      const data=await res.json();
      status('[100%] ✓ Deployed to Vercel: '+data.url);
      chrome.tabs.create({url:data.url});
    }else{
      status('[100%] Vercel deployment requires API token. Visit https://vercel.com/account/tokens');
    }
  }catch(e){
    err('Vercel deployment failed: '+e.message);
  }
}

chrome.runtime.onMessage.addListener((msg,_s,send)=>{
  if(!msg||!msg.type)return;
  if(msg.type==='SITEFORGE_SCRAPE_PREVIEW'){preview();send({ok:true});}
  else if(msg.type==='SITEFORGE_SCRAPE_BUILD'){build({format:msg.format,multiPage:msg.multiPage,deploy:msg.deploy});send({ok:true});}
  else if(msg.type==='SITEFORGE_VERCEL'){chrome.tabs.create({url:'https://vercel.com/new'});send({ok:true});}
  return true;
});
