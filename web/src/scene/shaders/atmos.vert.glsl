uniform float top; varying vec3 vPw; varying vec3 vC; varying float vR;
void main(){ vec4 w=modelMatrix*vec4(position,1.0); vPw=w.xyz; vC=modelMatrix[3].xyz; vR=length(modelMatrix[0].xyz)/top; gl_Position=projectionMatrix*viewMatrix*w; }
