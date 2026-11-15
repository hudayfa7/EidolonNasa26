varying vec2 vUv; varying vec3 vNw; varying vec3 vPw; varying vec3 vE; varying vec3 vNn; varying vec3 vO; varying vec3 vX; varying vec3 vZ;
void main(){ vUv=uv; vO=position; vec3 n=normalize(normal); vec3 e=normalize(vec3(n.z,0.0,-n.x)+vec3(1e-5)); vec3 nn=normalize(cross(n,e)); mat3 m=mat3(modelMatrix);
  vNw=normalize(m*n); vE=normalize(m*e); vNn=normalize(m*nn); vX=normalize(m[0]); vZ=normalize(m[2]); vec4 w=modelMatrix*vec4(position,1.0); vPw=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }
