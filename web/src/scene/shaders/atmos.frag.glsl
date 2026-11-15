// Atmosphere: single scattering, Rayleigh plus Mie, through an exponential atmosphere (lengths in the planet's radius).
// The light reaching each sample is dimmed by its optical depth toward the sun (Schüler's approximation of the Chapman
// function), which also puts the night side in shadow, so the limb brightens toward the sun when it is backlit. Drawn
// additively (renderer.ts addBlend): it lights what is behind it and leaves alpha, what the bodies cover, alone. Over
// the disc the haze is turned down (discK) away from the limb: scale heights are exaggerated so the limb reads at globe
// scale, which would otherwise wash the surface out.
uniform vec3 sunDir, betaR, betaM; uniform float top, H, g, sunI, discK, opacity; varying vec3 vPw; varying vec3 vC; varying float vR;
// Entry and exit distances along a ray; a miss has entry > exit.
vec2 ray(vec3 o, vec3 d, float r){ float b=dot(o,d), h=b*b-dot(o,o)+r*r; if(h<0.0) return vec2(1.0,-1.0); h=sqrt(h); return vec2(-b-h,-b+h); }
// Optical depth over H's column, from x scale heights up, along a ray at zenith cosine c, on a planet X scale heights round.
float chapman(float X, float x, float c){
  float s=sqrt(X+x);
  if(c>=0.0) return s/(s*c+1.0)*exp(-x);
  float x0=sqrt(max(1.0-c*c,0.0))*(X+x);   // c rounds a hair past -1 on the antisolar axis: one NaN, bloomed, blacks out the frame
  return 2.0*sqrt(x0)*exp(min(X-x0,60.0))-s/(1.0-s*c)*exp(-x);
}
void main(){
  vec3 o=(cameraPosition-vC)/vR, d=normalize(vPw-cameraPosition);
  // The ground is the sphere mesh's polygon (160 × 110 segments), up to 3e-4 inside the unit sphere: a ray stopped at the
  // unit sphere left the slivers between them dark, dashes along every horizon.
  vec2 a=ray(o,d,top), p=ray(o,d,0.9997); bool hit=p.x<=p.y&&p.x>0.0; a.x=max(a.x,0.0); if(hit) a.y=min(a.y,p.x);
  if(a.y<=a.x) discard;
  float ds=(a.y-a.x)/float(STEPS), od=0.0; vec3 ext=betaR+betaM*1.11, sum=vec3(0.0);
  for(int i=0;i<STEPS;i++){
    vec3 x=o+d*(a.x+ds*(float(i)+0.5)); float r=length(x), rho=exp(-(r-1.0)/H)*ds;
    od+=rho*0.5;
    sum+=rho*exp(-ext*(od+H*chapman(1.0/H,(r-1.0)/H,dot(x,sunDir)/r)));
    od+=rho*0.5;
  }
  if(hit) sum*=mix(discK,1.0,smoothstep(0.9,1.0,length(cross(o,d))));
  float mu=dot(d,sunDir), g2=g*g;
  float pR=0.0596831*(1.0+mu*mu), pM=0.1193662*(1.0-g2)*(1.0+mu*mu)/((2.0+g2)*pow(1.0+g2-2.0*g*mu,1.5));
  gl_FragColor=vec4(sunI*sum*(betaR*pR+betaM*pM)*opacity,1.0);
}
