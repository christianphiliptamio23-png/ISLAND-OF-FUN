// Fullscreen requires a user gesture. Try once per page and respect browser exit controls.
function enterFullscreen(){
  document.removeEventListener('click',enterFullscreen,true);
  if(document.fullscreenElement||document.webkitFullscreenElement)return;
  const root=document.documentElement;
  const request=root.requestFullscreen||root.webkitRequestFullscreen;
  if(!request)return;
  try{Promise.resolve(request.call(root)).catch(()=>{});}catch{}
}
document.addEventListener('click',enterFullscreen,true);
