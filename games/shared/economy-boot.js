// Select the same local account as the island before classic game scripts read saves.
try{
 const db=JSON.parse(localStorage.getItem('island-of-fun-profiles-v1'))||{};
 window.IOFProfileId=db.activeAccount||sessionStorage.getItem('island-of-fun-guest-id')||'standalone';
}catch{window.IOFProfileId='standalone';}
