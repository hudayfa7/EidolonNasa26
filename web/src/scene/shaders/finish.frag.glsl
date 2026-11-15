// The frame's finish (scene/post.ts): the scene's linear HDR plus bloom and the title sun's lens flare, AgX tone mapping
// and the saturation grade, then the grounds the CSS drew behind the old transparent canvas, under what the bodies leave
// uncovered (alpha, kept: the detection grade at the end of the pipeline reads it). Grounds are design tokens in sRGB
// (tokens.css, read by scene/post.ts), mixed in sRGB as CSS does, and skip the tone map.
#include <tonemapping_pars_fragment>
uniform sampler2D bloomTex; uniform float bloomK, exposure, sat, title, sky, flare, streak; uniform vec2 sunUV, warm;
uniform vec3 skyA, skyB, skyC, stageC[3], titleC[5];
float ell(vec2 p, vec2 c, vec2 r, float stop){ return max(0.0, 1.0-length((p-c)/r)/stop); }   // a CSS radial-gradient ellipse
vec3 ground(vec2 uv){
  vec2 p=vec2(uv.x,1.0-uv.y);   // CSS: from the top left
  vec3 g=stageC[0];   // --bg, under the stage's two glows: the warm one on the side the light comes from (`warm`, a
  // screen direction: scene/frame.ts), the cool one opposite; from the left, as the CSS had them
  g=mix(g,stageC[1],0.08*ell(p,vec2(0.5,0.45)+0.58*warm,vec2(0.55,0.75),0.62));
  g=mix(g,stageC[2],0.05*ell(p,vec2(0.5,0.30)-0.58*warm,vec2(0.40,0.50),0.70));
  vec3 t=p.y<0.6?mix(titleC[0],titleC[1],p.y/0.6):mix(titleC[1],titleC[2],(p.y-0.6)/0.4);   // title ground
  t=mix(t,titleC[3],0.55*ell(p,vec2(0.10,0.90),vec2(0.70,0.80),0.70));
  t=mix(t,titleC[4],0.22*ell(p,vec2(0.78,0.18),vec2(0.60,0.70),0.62));
  vec3 s=p.y<0.62?mix(skyA,skyB,p.y/0.62):mix(skyB,skyC,(p.y-0.62)/0.38);   // the dive's sky
  return sRGBToLinear(vec4(mix(mix(g,t,title),s,sky),1.0)).rgb;
}
// A restrained flare: a thin streak across the frame (faded while the sun sits on a horizon, where it would read as a
// second one) and three ghosts on the line from the sun to the centre, short of it: beyond the centre they landed on the
// title's wordmark and captions.
vec3 lensFlare(vec2 uv){
  vec2 asp=vec2(resolution.x/resolution.y,1.0), d=(uv-sunUV)*asp, ax=vec2(0.5)-sunUV;
  vec3 f=vec3(1.0,0.84,0.74)*exp(-abs(d.y)*900.0)*exp(-abs(d.x)*2.2)*streak;
  f+=vec3(1.0,0.8,0.6)*smoothstep(0.12,0.0,length((uv-sunUV-ax*0.3)*asp))*0.008;
  f+=vec3(0.55,0.75,1.0)*smoothstep(0.035,0.02,length((uv-sunUV-ax*0.55)*asp))*0.012;
  f+=vec3(0.6,0.9,0.8)*smoothstep(0.02,0.012,length((uv-sunUV-ax*0.75)*asp))*0.01;
  return f*flare;
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  float a=clamp(inputColor.a,0.0,1.0);
  vec3 c=AgXToneMapping((inputColor.rgb+texture2D(bloomTex,uv).rgb*bloomK+lensFlare(uv))*exposure);
  float l=dot(c,vec3(0.2126,0.7152,0.0722)); c=max(mix(vec3(l),c,sat),0.0);
  outputColor=vec4(c+ground(uv)*(1.0-a),a);
}
