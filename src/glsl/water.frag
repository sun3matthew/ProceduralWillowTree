uniform vec3 color;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform float time;

varying vec4 vUv;

#include <logdepthbuf_pars_fragment>

float blendOverlay( float base, float blend ) {

    return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

}

vec3 blendOverlay( vec3 base, vec3 blend ) {

    return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

}

void main() {
    #include <logdepthbuf_fragment>

    float waveStrength = 0.1;
    float waveSpeed = 0.03;
    vec2 newUv = texture2D( tNormal, vec2( vUv.x + time * waveSpeed, vUv.y ) ).rg * waveStrength;
    vec2 offsetUv = vUv.xy + vec2( newUv.x, newUv.y * time * waveSpeed );

    vec2 distored = (texture2D( tNormal, offsetUv ).rg * 2.0 - 1.0) * waveStrength;

    vec4 uv = vec4( vUv );
    uv.x += distored.x;

    vec4 base = texture2DProj( tDiffuse, uv );
    gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

    #include <tonemapping_fragment>
    #include <colorspace_fragment>

}