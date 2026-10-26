export async function requestPush(){
  try{ if(Notification.permission==="default") await Notification.requestPermission(); }catch{}
}
export function notify(title, body){
  try{ if(Notification.permission==="granted") new Notification(title, { body }); }catch{}
}