/* 공용: 라인 아이콘 주입 + 스크롤 진입 모션 */
(function(){
  var I={
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    heart:'<path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3 1.2 3.8 2.3.6.9 1.6.9 2.2 0C12.9 6.7 14 5.5 16 5.5c3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/>',
    eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    users:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M15.5 20c0-2.4 1.4-4 3.5-4"/>',
    deal:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
    yen:'<circle cx="12" cy="12" r="9"/><path d="M8.5 8l3.5 4 3.5-4M12 12v4M9.5 13h5"/>',
    star:'<path d="M12 3.5l2.4 5.2 5.6.5-4.2 3.7 1.3 5.5L12 15.8 6.9 18.9l1.3-5.5L4 9.7l5.6-.5z"/>',
    play:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M11 9.5l4 2.5-4 2.5z"/>',
    chat:'<path d="M5 4h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>',
    check:'<path d="M5 12l5 5 9-11"/>',
    minus:'<path d="M5 12h14"/>',
    doc:'<path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>',
    book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/>',
    target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    flag:'<path d="M5 21V4M5 4h11l-2 3 2 3H5"/>',
    search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/>',
    bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.7.6-1 1.2-1 2H9c0-.8-.3-1.4-1-2A6 6 0 0 1 12 3z"/>',
    bell:'<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0"/>',
    pin:'<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    cube:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5"/>',
    cal:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>',
    chart:'<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7"/>',
    people:'<circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>',
    edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    snow:'<path d="M12 2v20M4 6l16 12M20 6L4 18"/>'
  };
  document.querySelectorAll('[data-ic]').forEach(function(el){
    var inner=I[el.getAttribute('data-ic')]; if(!inner)return;
    var s=document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');
    s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width',el.getAttribute('data-sw')||'1.8');
    s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');
    if(el.getAttribute('class'))s.setAttribute('class',el.getAttribute('class'));
    s.innerHTML=inner; el.replaceWith(s);
  });
  if(matchMedia('(prefers-reduced-motion: no-preference)').matches){
    document.documentElement.classList.add('js');
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.1,rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  }
})();

/* 문서 뷰어 모달: [data-doc](base/count/title) 안의 [data-doc-open] 클릭 → 전체 페이지 */
(function(){
  function openDoc(base,count,title,start){
    var m=document.createElement('div');m.className='docmodal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
    var imgs='';for(var i=1;i<=count;i++){imgs+='<img data-p="'+i+'" src="'+base+i+'.webp" loading="lazy" alt="'+title+' '+i+'페이지">';}
    m.innerHTML='<div class="docmodal-bar"><span class="docmodal-title">'+title+'</span><button class="docmodal-close" type="button">닫기 ✕</button></div><div class="docmodal-scroll">'+imgs+'</div>';
    document.body.appendChild(m);document.body.classList.add('doclock');
    function close(){m.remove();document.body.classList.remove('doclock');document.removeEventListener('keydown',onkey);}
    function onkey(e){if(e.key==='Escape')close();}
    m.querySelector('.docmodal-close').addEventListener('click',close);
    m.addEventListener('click',function(e){if(e.target===m)close();});
    document.addEventListener('keydown',onkey);
    if(start&&start>1){var t=m.querySelector('.docmodal-scroll img[data-p="'+start+'"]');if(t)t.scrollIntoView();}
  }
  document.addEventListener('click',function(e){
    var trig=e.target.closest('[data-doc-open]');if(!trig)return;
    var host=trig.closest('[data-doc]');if(!host)return;e.preventDefault();
    openDoc(host.getAttribute('data-base'),+host.getAttribute('data-count'),host.getAttribute('data-title'),+(trig.getAttribute('data-page')||1));
  });
})();
