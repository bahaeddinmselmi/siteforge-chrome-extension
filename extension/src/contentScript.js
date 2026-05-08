/* global chrome */
(function(){
  const S=self.SiteForgeScraper;
  chrome.runtime.onMessage.addListener((msg,_s,send)=>{
    if(!msg||!msg.type)return;
    if(msg.type==='SITEFORGE_SNAPSHOT'){
      (async()=>{try{const snap=await S.createSnapshot({screenshots:msg.screenshots,maxNodes:800});send({ok:true,snapshot:snap});}catch(e){console.error('SiteForge snapshot error',e);send({ok:false,error:String(e.message||e)});}})();
      return true;
    }
    if(msg.type==='SITEFORGE_CRAWL_PAGES'){
      (async()=>{try{const pages=await S.crawlPages(msg.maxPages||10);send({ok:true,pages});}catch(e){console.error('SiteForge crawl error',e);send({ok:false,error:String(e.message||e)});}})();
      return true;
    }
  });
})();
