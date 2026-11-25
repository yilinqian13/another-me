(()=>{
  const input=document.getElementById('figure-photo'), image=document.getElementById('figure-preview'), placeholder=document.getElementById('figure-placeholder'), status=document.getElementById('figure-status'), style=document.getElementById('figure-style'), generate=document.getElementById('generate-figure'), download=document.getElementById('download-figure'), caption=document.getElementById('figure-caption'), ai=document.getElementById('generate-ai');
  let previewUrl='', resultUrl='', file=null;
  function show(src,label){const old=previewUrl;previewUrl=src;image.src=src;image.hidden=false;placeholder.hidden=true;caption.textContent=label;if(old&&old!==resultUrl)URL.revokeObjectURL(old)}
  input.addEventListener('change',()=>{
    const f=input.files[0];if(!f)return;
    if(!['image/png','image/jpeg','image/webp'].includes(f.type)||!f.size||f.size>10*1024*1024){status.textContent='Choose a JPG, PNG or WebP image under 10 MB.';input.value='';return}
    file=f;if(resultUrl){URL.revokeObjectURL(resultUrl);resultUrl=''}download.hidden=true;show(URL.createObjectURL(f),'PHOTO PREVIEW');status.textContent='Photo ready. Select a style, then generate.';generate.disabled=false;ai.disabled=false;
  });
  generate.addEventListener('click',async()=>{
    if(!file)return; generate.disabled=true; ai.disabled=true; status.textContent='Creating your free preview…';
    try {
      const bitmap=await createImageBitmap(file), canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}); const mode=style.value;
      ctx.fillStyle='#17121f';ctx.fillRect(0,0,1024,1024);
      const side=Math.min(bitmap.width,bitmap.height),sx=(bitmap.width-side)/2,sy=(bitmap.height-side)/2;
      if(mode==='pixel'){
        const small=document.createElement('canvas');small.width=small.height=64;small.getContext('2d').drawImage(bitmap,sx,sy,side,side,0,0,64,64);ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,1024,1024);ctx.imageSmoothingEnabled=true;
      } else if(mode==='collage'){
        ctx.fillStyle='#e9dfd3';ctx.fillRect(0,0,1024,1024);ctx.save();ctx.translate(512,512);ctx.rotate(-.045);ctx.fillStyle='#fff8ed';ctx.shadowColor='#241d29';ctx.shadowBlur=28;ctx.fillRect(-400,-410,800,820);ctx.shadowBlur=0;ctx.drawImage(bitmap,sx,sy,side,side,-370,-380,740,740);ctx.restore();ctx.globalAlpha=.8;ctx.fillStyle='#c9b0e5';ctx.fillRect(65,90,220,28);ctx.fillStyle='#d4a59c';ctx.fillRect(750,850,190,40);ctx.globalAlpha=1;
      } else if(['mono','duotone','vintage','pop','sketch'].includes(mode)){
        ctx.drawImage(bitmap,sx,sy,side,side,0,0,1024,1024);
        if(mode==='pop'){for(let y=0;y<2;y++)for(let x=0;x<2;x++)ctx.drawImage(bitmap,sx,sy,side,side,x*512,y*512,512,512)}
        const data=ctx.getImageData(0,0,1024,1024),p=data.data,lum=new Uint8Array(1024*1024);
        for(let i=0;i<lum.length;i++)lum[i]=Math.round(.2126*p[i*4]+.7152*p[i*4+1]+.0722*p[i*4+2]);
        const palettes=[[[26,18,99],[255,100,174]],[[31,84,81],[239,248,90]],[[95,20,62],[255,184,65]],[[16,55,113],[112,239,224]]];
        for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){
          const n=y*1024+x,i=n*4,l=lum[n];
          if(mode==='mono'){p[i]=p[i+1]=p[i+2]=Math.max(0,Math.min(255,(l-128)*1.25+128))}
          else if(mode==='duotone'){const t=l/255;p[i]=Math.round(35+215*t);p[i+1]=Math.round(20+170*t);p[i+2]=Math.round(72+168*t)}
          else if(mode==='vintage'){const r=p[i],g=p[i+1],b=p[i+2];p[i]=Math.min(255,r*.393+g*.769+b*.189);p[i+1]=Math.min(255,r*.349+g*.686+b*.168);p[i+2]=Math.min(255,r*.272+g*.534+b*.131)}
          else if(mode==='sketch'){const edge=Math.abs(l-lum[Math.min(n+1,lum.length-1)])+Math.abs(l-lum[Math.min(n+1024,lum.length-1)]);const v=Math.max(0,255-edge*4);p[i]=v;p[i+1]=v;p[i+2]=Math.min(255,v+3)}
          else {const t=Math.round(l/85)/3;const colors=palettes[(y>=512?2:0)+(x>=512?1:0)];for(let k=0;k<3;k++)p[i+k]=colors[0][k]*(1-t)+colors[1][k]*t}
        }
        ctx.putImageData(data,0,0);
        if(mode==='pop'){const tile=document.createElement('canvas');tile.width=tile.height=1024;tile.getContext('2d').drawImage(ctx.canvas,0,0);for(let y=0;y<2;y++)for(let x=0;x<2;x++)ctx.drawImage(tile,x*512,y*512,512,512,x*512,y*512,512,512);ctx.strokeStyle='#191421';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(512,0);ctx.lineTo(512,1024);ctx.moveTo(0,512);ctx.lineTo(1024,512);ctx.stroke()}
      } else {
        ctx.filter='saturate(1.45) contrast(1.3)';ctx.drawImage(bitmap,sx,sy,side,side,0,0,1024,1024);ctx.filter='none';
        if(mode==='comic'){const data=ctx.getImageData(0,0,1024,1024),p=data.data;for(let i=0;i<p.length;i+=4){p[i]=Math.round(p[i]/48)*48;p[i+1]=Math.round(p[i+1]/48)*48;p[i+2]=Math.round(p[i+2]/48)*48}ctx.putImageData(data,0,0)}
      }
      bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Could not create the preview. Please try another photo.');
      const next=URL.createObjectURL(blob),previous=resultUrl;resultUrl=next;show(next,'FREE STYLE PREVIEW');if(previous&&previous!==previewUrl)URL.revokeObjectURL(previous);download.href=next;download.hidden=false;status.textContent='Your simplified preview is ready. Select Download image to save it.';
    } catch(e){status.textContent='Could not create the preview. Please try another photo.'} finally{generate.disabled=false;ai.disabled=false}
  });
  ai.addEventListener('click',async()=>{
    if(!file)return;generate.disabled=true;ai.disabled=true;input.disabled=true;style.disabled=true;status.textContent='Creating your image… This can take a few minutes.';
    const form=new FormData();form.append('image',file);form.append('style',style.value);
    try{
      const response=await fetch('/api/figurine',{method:'POST',body:form});
      if(!response.ok){const err=await response.json().catch(()=>({}));throw new Error(err.error||'Generation failed. Please try again.')}
      const result=await response.blob();if(!result.type.startsWith('image/')||!result.size)throw new Error('The image could not be displayed. Please try again.');
      const next=URL.createObjectURL(result);const probe=new Image();
      try{await new Promise((resolve,reject)=>{probe.onload=resolve;probe.onerror=reject;probe.src=next})}catch{URL.revokeObjectURL(next);throw new Error('The image could not be displayed. Please try again.')}
      const previous=resultUrl;resultUrl=next;show(next,'GENERATED IMAGE');if(previous&&previous!==previewUrl)URL.revokeObjectURL(previous);download.href=next;download.hidden=false;status.textContent='Your image is ready. Use Download image to save it.';
    }catch(e){status.textContent=e.message||'Generation failed. Please try again.'}finally{generate.disabled=false;ai.disabled=false;input.disabled=false;style.disabled=false}
  });
})();
