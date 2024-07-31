uniform mat4 viewProj;
attribute vec3 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
    gl_Position = viewProj * vec4(a_position, 1.0);
    v_texCoord = a_texCoord;
}
