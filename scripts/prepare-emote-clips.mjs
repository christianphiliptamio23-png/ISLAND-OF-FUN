import fs from 'node:fs';import vm from 'node:vm';
const context={console:{warn(){},error:console.error},TextDecoder,TextEncoder,URL,Blob};context.window=context;context.self=context;vm.createContext(context);
for(const file of ['three.min.js','fflate.min.js','FBXLoader.js'])vm.runInContext(fs.readFileSync('assets/vendor/'+file,'utf8'),context);
const T=context.THREE;T.TextureLoader.prototype.load=function(){return new T.Texture();};
fs.mkdirSync('assets/emotes/clips',{recursive:true});let skeleton;
for(let i=1;i<=5;i++){
 const dir='assets/emotes/dance'+i,file=fs.readdirSync(dir).find(f=>f.endsWith('.fbx')),bytes=fs.readFileSync(dir+'/'+file),model=new T.FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const bones=[];model.traverse(o=>{if(o.isBone)bones.push(o.name)});bones.sort();const names=JSON.stringify(bones);if(skeleton&&skeleton!==names)throw Error('Incompatible dance skeleton');skeleton=names;
 const clip=model.animations[0].clone();
 for(const track of clip.tracks){const stride=track.getValueSize();if(track.values.every((value,index)=>Math.abs(value-track.values[index%stride])<.0001)){track.times=new Float32Array([0]);track.values=track.values.slice(0,stride);}}
 clip.optimize();
 const header=Buffer.from(JSON.stringify({version:1,name:clip.name,duration:clip.duration,tracks:clip.tracks.map(t=>({name:t.name,type:t.ValueTypeName,count:t.times.length,stride:t.getValueSize()}))}));
 const prefix=Buffer.alloc(8);prefix.write('IOFA');prefix.writeUInt32LE(header.length,4);
 const chunks=[prefix,header];for(const track of clip.tracks)for(const values of [track.times,track.values]){const bytes=Buffer.alloc(values.length*4);for(let n=0;n<values.length;n++)bytes.writeFloatLE(values[n],n*4);chunks.push(bytes);}
 const output=Buffer.concat(chunks);fs.writeFileSync('assets/emotes/clips/dance'+i+'.anim',output);console.log('Dance '+i+': '+output.length+' bytes');
}
