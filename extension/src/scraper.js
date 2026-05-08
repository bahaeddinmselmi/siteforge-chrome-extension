(function(){
  function meta(){
    const m={};
    document.querySelectorAll('meta[name],meta[property]').forEach(x=>{
      const k=x.getAttribute('name')||x.getAttribute('property');
      if(k&&!m[k])m[k]=x.getAttribute('content')||'';
    });
    return{
      url:location.href,
      title:document.title||'',
      lang:document.documentElement.lang||'',
      bodyClass:document.body&&document.body.className?String(document.body.className):'',
      meta:m
    };
  }

  async function fetchAssets(){
    const assets={};
    const urlMap={};
    const imgs=Array.from(document.querySelectorAll('img')).slice(0,50);
    for(const img of imgs){
      try{
        const raw=img.getAttribute('src')||img.src;
        if(!raw||raw.startsWith('data:'))continue;
        const u=new URL(raw,location.href);
        const src=u.href;
        const path=u.pathname||'';
        const short=path.startsWith('/')?path.substr(1):path;
        const r=await fetch(src,{mode:'cors'});
        if(r.ok){
          const blob=await r.blob();
          const reader=new FileReader();
          await new Promise(resolve=>{
            reader.onload=()=>{
              const baseName=path.split('/').pop()||'image.png';
              const uniquePath='img-'+Object.keys(assets).length+'-'+baseName;
              assets[uniquePath]=reader.result;
              urlMap[src]=uniquePath;
              urlMap[path]=uniquePath;
              if(short)urlMap[short]=uniquePath;
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        }
      }catch(_){ }
    }
    return{assets,urlMap};
  }

  async function fetchBackgroundImages(){
    const bgAssets={};
    const urlMap={};
    const allElements=Array.from(document.querySelectorAll('*'));
    const bgUrls=new Set();
    for(const el of allElements){
      const bg=window.getComputedStyle(el).backgroundImage;
      if(bg&&bg.includes('url(')){
        const match=bg.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if(match&&match[1])bgUrls.add(match[1]);
      }
    }
    let idx=0;
    for(const raw of bgUrls){
      if(idx>=30)break;
      try{
        const u=new URL(raw,location.href);
        const src=u.href;
        const path=u.pathname||'';
        const short=path.startsWith('/')?path.substr(1):path;
        const r=await fetch(src,{mode:'cors'});
        if(r.ok){
          const blob=await r.blob();
          const reader=new FileReader();
          await new Promise(resolve=>{
            reader.onload=()=>{
              const ext=(path.split('.').pop()||'png').split('?')[0]||'png';
              const fname='bg-'+idx+'.'+ext;
              bgAssets[fname]=reader.result;
              urlMap[src]=fname;
              urlMap[path]=fname;
              if(short)urlMap[short]=fname;
              idx++;
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        }
      }catch(_){ }
    }
    return{bgAssets,urlMap};
  }

  async function fetchStyles(){
    const styles={};
    const links=Array.from(document.querySelectorAll('link[rel="stylesheet"]')).slice(0,10);
    for(const l of links){
      try{
        const r=await fetch(l.href,{mode:'cors'});
        if(r.ok){
          const path=new URL(l.href).pathname.split('/').pop()||'style.css';
          styles[path]=await r.text();
        }
      }catch(_){ }
    }
    const allInlineStyles=Array.from(document.querySelectorAll('style')).map(s=>s.textContent).join('\n\n');
    if(allInlineStyles){
      styles['_inline_styles.css']=allInlineStyles;
    }
    const computedStyles=[];
    for(const el of document.querySelectorAll('[style]')){
      const style=el.getAttribute('style');
      if(style)computedStyles.push(style);
    }
    return styles;
  }

  async function createSnapshot(opts){
    const info=meta();
    const html=document.documentElement.outerHTML;
    const{assets,urlMap}=await fetchAssets();
    const{bgAssets,urlMap:bgUrlMap}=await fetchBackgroundImages();
    const styles=await fetchStyles();
    const inlineStyles=Array.from(document.querySelectorAll('style')).map(s=>s.textContent).join('\n');
    const allAssets={...assets,...bgAssets};
    const allUrlMaps={...urlMap,...bgUrlMap};
    return{
      url:info.url,
      title:info.title,
      lang:info.lang,
      bodyClass:info.bodyClass,
      meta:info.meta,
      fullHtml:html,
      inlineStyles,
      externalStyles:styles,
      assets:allAssets,
      assetUrlMap:allUrlMaps,
      summary:{assetsCount:Object.keys(allAssets).length,stylesCount:Object.keys(styles).length}
    };
  }

  async function crawlPages(maxPages=10){
    const visited=new Set();
    const pages=[];
    const queue=[location.href];

    while(queue.length>0&&pages.length<maxPages){
      const url=queue.shift();
      if(visited.has(url))continue;
      visited.add(url);

      try{
        const r=await fetch(url);
        if(!r.ok)continue;
        const html=await r.text();
        const parser=new DOMParser();
        const doc=parser.parseFromString(html,'text/html');
        const body=doc.body||null;

        pages.push({
          url,
          html,
          title:doc.title||'Page',
          lang:doc.documentElement.lang||'',
          bodyClass:body&&body.className?String(body.className):''
        });

        const links=Array.from(doc.querySelectorAll('a[href]')).slice(0,20);
        for(const a of links){
          let href=a.getAttribute('href');
          if(!href||href.startsWith('#')||href.startsWith('javascript:'))continue;
          try{
            const u=new URL(href,url);
            if(u.origin===location.origin&&!visited.has(u.href)){
              queue.push(u.href);
            }
          }catch(_){ }
        }
      }catch(_){ }
    }

    return pages;
  }

  async function detectWordPress(){
    try{
      const r=await fetch('/wp-json/wp/v2/posts?per_page=1');
      if(r.ok)return true;
    }catch(_){ }
    return false;
  }

  async function fetchWordPressPosts(limit=10){
    const posts=[];
    try{
      const r=await fetch('/wp-json/wp/v2/posts?per_page='+limit);
      if(r.ok){
        const data=await r.json();
        for(const post of data){
          posts.push({
            id:post.id,
            title:post.title.rendered,
            content:post.content.rendered,
            excerpt:post.excerpt.rendered,
            slug:post.slug,
            date:post.date,
            featured_media:post.featured_media
          });
        }
      }
    }catch(_){ }
    return posts;
  }

  self.SiteForgeScraper={createSnapshot,crawlPages,detectWordPress,fetchWordPressPosts};
})();
