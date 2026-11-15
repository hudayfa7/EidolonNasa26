// Planet surface (prototype 928–955), in linear light: maps decode from sRGB, the output is HDR for scene/post.ts.
// The relief from a normal map baked from the DEM (slopes east and north); the Moon's south polar cap (coords.ts
// llToCap) replaces the map and the relief near the pole, where the equirectangular maps pinch; at the other poles the
// relief fades out instead. Lambert lighting, but Lommel-Seeliger on the Moon (`ls`), whose regolith Lambert makes plastic.
uniform sampler2D map, mapLo, nmap, night, spec, cap, capN, cloud; uniform float bumpK, nOn, ls, fill, hasNight, hasSpec, hasCap, capS, capK, opacity, grat, rimK, ready, sharp, cloudK, cloudU, cOn; uniform vec2 gdiv; uniform vec3 sunDir, rimC, mean;
varying vec2 vUv; varying vec3 vNw; varying vec3 vPw; varying vec3 vE; varying vec3 vNn; varying vec3 vO; varying vec3 vX; varying vec3 vZ;
void main(){
  vec3 Ng=normalize(vNw); vec3 N=Ng; vec3 o=normalize(vO);
  float bk=bumpK*nOn*(1.0-smoothstep(0.985,0.998,abs(o.y)));
  if(bk>0.0){
    vec2 s=texture2D(nmap,vUv).rg*2.0-1.0; s*=abs(s)*0.5;   // stored as sign·√(|s| / .5) (scripts/fetch-real-data.mjs normal)
    N=normalize(Ng-bk*(s.x*normalize(vE)+s.y*normalize(vNn)));
  }
  vec3 m=texture2D(map,vUv).rgb; if(sharp<1.0) m=mix(texture2D(mapLo,vUv).rgb,m,sharp);   // the low tier fading out (planet.ts)
  vec3 alb=mix(mean,m,ready);   // the mean colour until the maps land
  if(hasCap>0.5&&o.y<-0.96){
    vec2 cu=o.xz/(1.0-o.y)/capS*0.5+0.5; float w=smoothstep(0.9703,0.9816,-o.y);   // 76° to 79° S
    vec2 s=texture2D(capN,cu).rg*2.0-1.0;   // slope along the cap's x and z
    vec3 tx=normalize(vX-Ng*dot(vX,Ng)), tz=normalize(vZ-Ng*dot(vZ,Ng));
    N=normalize(mix(N,normalize(Ng-capK*(s.x*tx+s.y*tz)),w)); alb=mix(alb,mix(mean,texture2D(cap,cu).rgb,ready),w);
  }
  // The title's clouds (planet.ts cloudK): white cover over the ground, its relief, its glint and most of its lights; the
  // thinnest haze left out, so the coasts still read.
  float cl=0.0;
  if(cloudK>0.0){ cl=smoothstep(0.12,0.85,texture2D(cloud,vec2(vUv.x-cloudU,vUv.y)).r)*cloudK*cOn; N=normalize(mix(N,Ng,cl)); alb=mix(alb,vec3(0.62),cl); }
  vec3 V=normalize(cameraPosition-vPw);
  float ndl=dot(N,sunDir), ndg=dot(Ng,sunDir);
  float term=smoothstep(-0.05,0.14,ndg), lit=max(ndl,0.0);
  // Lommel-Seeliger mixed with Lambert (McEwen's lunar function, its L at .6): as bright face on, a flatter disc and a
  // crisper terminator.
  if(ls>0.5) lit=1.2*lit/(lit+max(dot(N,V),0.0)+1e-3)+0.4*lit;
  // The night side's faint fill (0.006 before AgX's toe), and where a view reads ground (`fill`, frame.ts) a dim one from
  // the viewer, so a site still reads when the sim clock turns it into night.
  vec3 col=alb*(max(lit*term*1.25,fill*max(dot(N,V),0.0))+0.03);
  if(hasSpec>0.5){ float w=texture2D(spec,vUv).r; vec3 H=normalize(sunDir+V); col+=vec3(1.0,0.94,0.84)*pow(max(dot(Ng,H),0.0),80.0)*w*0.22*term*(1.0-cl); }
  if(hasNight>0.5){   // the lights only: the map's moonlit blue base read as a purple smear on the night side up close
    vec3 n=texture2D(night,vUv).rgb; n*=smoothstep(0.02,0.35,dot(n,vec3(0.2126,0.7152,0.0722)));
    col+=n*vec3(1.0,0.72,0.42)*1.3*(1.0-smoothstep(-0.25,0.05,ndg))*(1.0-0.8*cl);
  }
  // The tokens' thin edge: a line about 2 px wide at any globe size (near the limb N·V over its screen derivative is about
  // twice the distance to the edge in pixels), over a soft fresnel; it reads apart from the atmosphere's haze.
  float ndv=max(dot(Ng,V),0.0), fr=pow(1.0-ndv,6.0)*0.35+1.0-smoothstep(2.0,5.0,ndv/max(fwidth(ndv),1e-5));
  col+=rimC*fr*rimK*smoothstep(-0.2,0.45,ndg);
  if(grat>0.0){
    vec2 g=vec2(vUv.x*gdiv.x,(vUv.y-0.5)*gdiv.y); vec2 fw=fwidth(g); vec2 d=abs(fract(g-0.5)-0.5)/max(fw,vec2(1e-4));
    float line=(1.0-min(min(d.x,d.y),1.0))*(1.0-smoothstep(0.42,0.48,abs(vUv.y-0.5)));
    col=mix(col,vec3(0.6),line*grat*0.1);
  }
  gl_FragColor=vec4(col,opacity);
}
