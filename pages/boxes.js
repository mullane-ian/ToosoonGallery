import { Suspense, useRef,useEffect,useMemo,useState } from 'react'
import * as THREE from "three";
import { Canvas, useThree, useFrame,useLoader,extend } from '@react-three/fiber'
import {Stage,Stars, useScroll,ScrollControls, Scroll, Preload, Image as ImageImpl, Float, Html, OrbitControls } from '@react-three/drei'
import Box from '../components/Image'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CustomPass } from '../components/CustomPass.js';
import LoadingScreen from '../components/LoadingScreen'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import glsl from "babel-plugin-glsl/macro"; // <--- Module to import
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js';
// Inside your app
import { useControls } from 'leva'
import gsap from "gsap";
import { ref } from 'valtio';
import myState from "../components/store"

const settings = {
  progress: 1,
  scale: 3
};
function distort(){
  gsap.to(settings, {progress:0,duration:2})
}
function unDistort(){
  gsap.to(settings, {progress:1,duration:1, delay: 2})
}

unDistort()

function MyEffects() {
  const { gl, scene, camera, size } = useThree()
  const { Progress,Scale } = useControls({
    Progress: {
      value: settings.progress,
      min: 0,
      max: 1,
      step: .1,
    },
    Scale: {
      value: settings.scale,
      min: 0,
      max: 10,
      step: .1,
    },
  })

 
  
  const [base, final] = useMemo(() => {
    const renderScene = new RenderPass(scene, camera);
    const offscreenTarget = new THREE.WebGLRenderTarget(size.width, size.height);
    const comp = new EffectComposer(gl);
    comp.addPass( renderScene );
    const effect1 = new ShaderPass(DotScreenShader)

    const finalComposer = new EffectComposer(gl);

    const effect = new ShaderPass(CustomPass)
    const fragment = `
    uniform vec2 center;
		uniform float angle;
		uniform float scale;
		uniform vec2 tSize;
        uniform float time;
        uniform float progress;
      

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		float pattern() {

			float s = sin( angle ), c = cos( angle );

			vec2 tex = vUv * tSize - center;
			vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;

			return ( sin( point.x ) * sin( point.y ) ) * 4.0;

		}

		void main() {
      
            vec2 newUV = vUv;





            vec2 p = 2.*vUv - vec2(1.);



          //   p += 0.1*cos(scale * 3.*p.yx + time + vec2(19.2,3.4));
          //  // p = 0.1*sin(scale * 3.7*p.yx + 1.4* time + vec2(2.2,3.4));
          // //   p += 0.1*cos(scale * 5.*p.yx + 2.6* time + vec2(4.2,3.4));
          //   // p = 0.1*tan(scale * 7.*p.yx + .006* time + vec2(0.2,1.4));
          //    //p += 0.05/tan(scale + 10.*p.yx + 3.6* time + vec2(10.2,3.4));

          

          

          p += 0.1*cos(scale * 3.*p.yx + time + vec2(1.2,3.4));
          p += 0.1*cos(scale * 3.7*p.yx + 1.4* time + vec2(2.2,3.4));
          p += 0.1*cos(scale * 5.*p.yx + 2.6* time + vec2(4.2,3.4));
           p -= .5*cos(scale * 7.*p.yx + 3.6* time + vec2(10.2,3.4));
          //  p += 0.2/sin(scale / 1.*p.yx + 3.6* time + vec2(10.2,3.4));
          


            newUV = vUv + p*vec2(0.,1.);

            newUV.x = mix(vUv.x, length(p), progress);
            newUV.y = mix(vUv.y, 0., progress);


			vec4 color = texture2D( tDiffuse, newUV );
            gl_FragColor = color;

           // gl_FragColor = vec4(length(p),newUV,1.);

		}
    `

    const vertex = `
    varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
    `
    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {

          'tDiffuse': { value: null },
          'tSize': { value: new THREE.Vector2( 256, 256 ) },
          'center': { value: new THREE.Vector2( 0.5, 0.5 ) },
          'angle': { value: 1.57 },
          'time' : {value: 0},
              'progress' : {value: Progress},
              'scale' : {value: settings.scale}
      
        },
        vertexShader:vertex,
        fragmentShader:fragment
      })
      
    )
    comp.addPass(finalPass)

    return [comp, finalComposer];
  }, []);


  useEffect(() => {
    base.setSize(size.width, size.height);
    final.setSize(size.width, size.height);
  }, [base, final, size])

  // const { toggle } = useControls({ toggle: true })
  // useEffect(()=>{
  //   if(toggle === true){
  //     gsap.to(base.passes[1].uniforms.progress, {value:1,duration:2})
  //   }else{
  //     gsap.to(base.passes[1].uniforms.progress, {value:0,duration:1})
  //   }
  // },[toggle])
  
  const data = useScroll();


  var key = 37;
  var keyboardEvent = document.createEvent('KeyboardEvent')


  // if(gamepads[0].buttons[4].pressed === true && base.passes[1].uniforms.scale.value > -10){
  //   base.passes[1].uniforms.scale.value -= 0.01
  // }

  const [showSecondary,setShowSecondary] = useState(false)
  return useFrame((state,delta) => {
    const gamepads = navigator.getGamepads()

    if(showSecondary === true){
      myState.showSecondary = true;
    }else{
      myState.showSecondary = false;
    }
    if(gamepads[0]){


      if(gamepads[0].buttons[3].pressed === true){
        myState.pause = true
      }
      // if(gamepads[0].buttons[2].pressed === true){
      //   myState.pause = false
      // }


      if(gamepads[0].buttons[5].pressed === true && base.passes[1].uniforms.scale.value < 8){
        base.passes[1].uniforms.scale.value += 0.025

      }
      if(gamepads[0].buttons[4].pressed === true && base.passes[1].uniforms.scale.value > -10){
        base.passes[1].uniforms.scale.value -= 0.025
      }

      console.log(gamepads[0].buttons[2].value)
      if(gamepads[0].buttons[2].value >0.5 && showSecondary === false ){

          gsap.to(state.camera.position, {y:10,duration:1, onComplete:setShowSecondary(true)})
        
      }
      if(gamepads[0].buttons[2].value >0.5 && showSecondary === true ){

          // setShowSecondary(false)
          gsap.to(state.camera.position, {y:0,duration:1, onComplete:setShowSecondary(false)})
        
      }

      // if(gamepads[0].buttons[2].value >0.5 ){
      //   if(showSecondary === true){
      //     setShowSecondary(true)

      //     gsap.to(state.camera.position, {y:10,duration:1})
      //     }
        
   
       
      // }



      if(gamepads[0].buttons[8].pressed === true){
        myState.pause = false
      }
     

 
 
      // if(gamepads[0].axes[0]>0.8  && state.camera.position.x < 30){
      //   console.log(state.camera)
      //   state.camera.position.x += 0.5
      // }
      // if(gamepads[0].axes[0]<-0.8  && state.camera.position.x > -25){
      //   console.log(state.camera)
      //   state.camera.position.x -= 0.5
      // }

      if(gamepads[0].axes[1]<-0.8 && state.camera.position.z > 4){
        console.log(state.camera)
        state.camera.position.z -= 0.05
      }
      if(gamepads[0].axes[1]>0.8 && state.camera.position.z < 8){
        console.log(state.camera)
        state.camera.position.z += 0.05
      }

//       KeyboardEvent {isTrusted: true, key: 'ArrowRight', code: 'ArrowRight', location: 0, ctrlKey: false, …}
// isTrusted: true
// altKey: false
// bubbles: true
// cancelBubble: false
// cancelable: true
// charCode: 0
// code: "ArrowRight"
// composed: true
// ctrlKey: false
// currentTarget: null
// defaultPrevented: false
// detail: 0
// eventPhase: 0
// isComposing: false
// key: "ArrowRight"
// keyCode: 39
// location: 0
// metaKey: false
// path: (4) [body, html, document, Window]
// repeat: false
// returnValue: true
// shiftKey: false
// sourceCapabilities: InputDeviceCapabilities {firesTouchEvents: false}
// srcElement: body
// target: body
// timeStamp: 438818.69999999925
// type: "keydown"
// view: Window {window: Window, self: Window, document: document, name: '', location: Location, …}
// which: 39
// [[Prototype]]: KeyboardEvent

      if(gamepads[0].buttons[0].pressed === true){
        gsap.to(base.passes[1].uniforms.progress, {value:1,duration:2})
        myState.effectToggle = true
      
      }
      if(gamepads[0].buttons[1].pressed === true){
        gsap.to(base.passes[1].uniforms.progress, {value:0.0,duration:2})
        myState.effectToggle = false
      }

      if(gamepads[0].buttons[9].pressed === true){
        myState.showMenu = true
      }
      if(gamepads[0].buttons[8].pressed === true){
        myState.showMenu = false
      }
    }

    if(myState.shouldDistort === true){
      gsap.to(base.passes[1].uniforms.progress, {value:1,duration:5})
      gsap.to(base.passes[1].uniforms.progress, {value:0,duration:6, delay: 3
      })

    }
    // console.log(myState.showMenu)
    //select: 8
    //start : 9
    // base.passes[1].uniforms.scale.value = Scale    
    // if(!toggle){
    //   base.passes[1].uniforms.progress.value = THREE.MathUtils.damp(base.passes[1].uniforms.progress.value, data.delta*50, 4, .10)

    // }
    // base.passes[1].uniforms.progress.value = Progress
    gl.autoClear = false
    gl.clear()
    base.passes[1].uniforms.time.value += 0.01
     base.render();
     //final.render();
  },1);
}

function SceneFog() {
  const { fog } = useControls({ fog: true })

  return(
    <>
    {
      fog?
      <fog attach="fog" color="black" near={1} far={20} />
    :
    null}
    </>

    
  )
}

function StartMenu(){
  let [showMenu,setShowMenu] = useState(false)
  const [y, setY] = useState(0)
  const menu = useRef();
  useFrame(() => {
  console.log(menu)
  if(myState.showMenu === true ){
    setShowMenu(true)
  }else{
    setShowMenu(false)
  }
  if(myState.showSecondary === true){
    setY(10)
  }else{
   setY(0)
    
  }
  });

  return(
    <>
    {showMenu?
      <Suspense fallback={null}>
      <Html fullscreen ref={menu} position={[0,y,0]}>
      <div className='main-container'>

      <div className='menu-container' >
     
    
     <div class="frame1"> 
     <img src="./logo.png" />
     </div> 
     <div class="frame">
       <div class="btn-group">
           <button class="button" type="button"><h2>NEW GAME</h2></button>
           <button class="button" type="button"><h2>LOAD GAME</h2></button>    
           <button class="button" type="button"><h2>TUTORIAL</h2></button>
       </div>
       </div>
  
     
    
  
   
  
   
   </div>
   </div>

      </Html>
  
      </Suspense>
  
    
    :<>
    </>}
    </>

   
  )
}





function ControllerContainer(){
    window.addEventListener('gamepadconnected', function(e) {
      console.log('gamepad connected')
      const gp = navigator.getGamepads()[e.gamepad.index]
    })
    window.addEventListener('gamepaddisconnected', function(e) {
      console.log('gamepad disconnected')
    })

    //buttons[0]: X (blue)
    //buttons[1]: A (red)
    //buttons[2]: B (yellow)
    //buttons[3]: Y (green)
    //buttons[4]: Left Bumper
    //buttons[5]: Right Bumper
    //axes[0]: left and right stick (-1:1)
    //axes[1]: up and down stick (-1:1)


  useFrame(()=>{
    const gamepads = navigator.getGamepads()
    if(gamepads[0]){
      const gamepadState= {
        buttons: [

        ]
      }
    }
  })

  return(null)
}

export default function BoxesPage() {
 
 

  return (
   
    <>


     
    <Canvas >
        <LoadingScreen />
          <StartMenu />
        {/* <ControllerContainer /> */}

        {/* <ambientLight intensity={1} />  */}
        {/* <pointLight position={[40, 40, 40]} />  */}
          {/* <SceneFog /> */}
          <ScrollControls visible={false} infinite horizontal damping={2} pages={0} distance={1}>
              <Scroll>
              <Suspense fallback={null}>
                <Pages />




              </Suspense>

          <MyEffects />
              </Scroll>

          </ScrollControls>
          {/* <OrbitControls /> */}
          <GroundPlane />
        <BackDrop />
      <KeyLight brightness={5.6} color={"#ffc9f9"} />
        <FillLight brightness={2.6} color={"#bdefff"} />
        <RimLight brightness={54} color={"#fff"} />
          {/* <Sphere /> */}
          {/* <Sky /> */}
          <Preload />
      </Canvas>
    </>
  )
}

// Geometry
function GroundPlane() {
  return (
    <mesh receiveShadow rotation={[-Math.PI/2, 0, 0]} position={[0, -5, 0]}>
      <planeBufferGeometry attach="geometry" args={[500, 500]} />
      <meshStandardMaterial attach="material" color="white" />
    </mesh>
  );
}
function BackDrop() {
  return (
    <mesh receiveShadow position={[0, -1, -5]}>
      <planeBufferGeometry attach="geometry" args={[500, 500]} />
      <meshStandardMaterial attach="material" color="white" />
    </mesh>
  );
}

// Lights
function KeyLight({ brightness, color }) {
  return (
    <rectAreaLight
      width={3}
      height={3}
      color={color}
      intensity={brightness}
      position={[-2, 0, 5]}
      lookAt={[0, 0, 0]}
      penumbra={1}
      castShadow
    />
  );
}
function FillLight({ brightness, color }) {
  return (
    <rectAreaLight
      width={3}
      height={3}
      intensity={brightness}
      color={color}
      position={[2, 1, 4]}
      lookAt={[0, 0, 0]}
      penumbra={2}
      castShadow
    />
  );
}

function RimLight({ brightness, color }) {
  return (
    <rectAreaLight
      width={2}
      height={2}
      intensity={brightness}
      color={color}
      position={[1, 4, -2]}
      rotation={[0, 180, 0]}
      castShadow
    />
  );
}


function Sphere(){
  const ref=useRef()
  const stars=useRef()
  const bottleMaterial = new THREE.MeshPhysicalMaterial({
    color: '#efefef',
    transmission: 1,
    roughness: 0.35,
    thickness: 500,
    envMapIntensity: 4,
  })
  useFrame(()=>{
    ref.current.rotation.z += .1
    stars.current.rotation.z += .001
    stars.current.rotation.x -= .001

  })


  return(
    <>
    {/* <ambientLight intensity={2} color={'white'}/> */}
    {/* <pointLight color={'white'} position={[0,5,-5]} intensity={2} distance={100}/> */}
    <mesh ref={ref} material={bottleMaterial}>
    <sphereBufferGeometry args={[20, 32,32]}/>
    {/* <meshNormalMaterial side={THREE.DoubleSide} color={0xffffff} attach="material" /> */}
    {/* <meshStandardMaterial metalness={2} roughness={0.32} color={'gold'} side={THREE.DoubleSide} attach="material" /> */}
   </mesh>
   <Stars  ref={stars} radius={30} depth={10} count={3000} factor={10} saturation={1} fade  speed={2} />

    </>

  )
}

function setEffectToggle(){
  myState.effectToggle = false
  console.log('hi')
}



function Image(props) {
  const { toggle } = useControls({ toggle: true })

  const ref = useRef();
  const img = useRef()
  const group = useRef();
  const data = useScroll();
  useFrame((state, delta) => {
     if(myState.effectToggle === true){
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -2, 4, delta);
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, -0.1, 4, delta);
     }else{
       group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, 0, 1, delta);
       group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -0.1, 4, delta);
  
     }

   
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, Math.max(0, data.delta * 100), 4, delta)
    if(myState.pause === false){
      group.current.position.x -= .05
    }

    if(group.current.position.x < -115){
      myState.effectToggle = true
      myState.shouldDistort=true
      gsap.to( group.current.position, {x:30,duration:4,onComplete:setEffectToggle})

      // group.current.position.y = -5

    }else{
      myState.shouldDistort=false

    }
    // group.current.position.x -= 0.1
    // ref.current.material.grayscale = THREE.MathUtils.damp(
    //   ref.current.material.grayscale,
    //   Math.max(0, data.delta * 500),
    //   4,
    //   delta
    // );
  });
  return (
    // <Float  rotationIntensity={0.5} floatIntensity={3} speed={1}>

    <group ref={group}>
        
      <ImageImpl ref={ref} {...props} />
    </group>
    // </Float>

  );
}

function Page({ m = 0.4, urls, ...props }) {
  const img = useRef()

  const { width } = useThree((state) => state.viewport);
  const w = width < 10 ? 1.5 / 3 : 1 / 3;
  useFrame((state, delta) => {
    if(img.current.position.x < -width * 2)
    {
      console.log('i am out of the screen')
       //img.current.rotation.z += .1
       //img.current.position.y = Math.sin(delta * 10) -1 

    }
});
  return (

    <group {...props}ref={img}>

      <Image  position={[-width * w, 0, -1]} scale={[width * w - m * 2, 5, 1]} url={urls[0]} />
      <Image position={[0, 0, 0]} scale={[width * w - m * 2, 5, 1]} url={urls[1]} />
      <Image position={[width * w, 0, 1]} scale={[width * w - m * 2, 5, 1]} url={urls[2]} />
    
    </group>


  );
}

function Pages() {
  const { width } = useThree((state) => state.viewport);
  const z = 0
  const y = 0
  return (
    <>
    
      <Page position={[-width * 1, y, z]} urls={["./img1/1.jpg", "./img1/2.jpg", "./img1/3.jpg"]} />
      <Page position={[width * 0, y, z]} urls={["./img1/4.jpg", "./img1/5.jpg", "./img1/6.jpg"]} />
      <Page position={[width * 1, y, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/9.jpg"]} />
      <Page position={[width * 2, y, z]} urls={["./img1/1.jpg", "./img1/2.jpg", "./img1/3.jpg"]} />
      <Page position={[width * 3, y, z]} urls={["./img1/4.jpg", "./img1/5.jpg", "./img1/6.jpg"]} />

{/* 
      <Page position={[-width * 1, y + 3, z]} urls={["./img1/1.jpg", "./img1/2.jpg", "./img1/3.jpg"]} />
      <Page position={[width * 0, y + 3, z]} urls={["./img1/4.jpg", "./img1/5.jpg", "./img1/6.jpg"]} />
      <Page position={[width * 1, y + 3, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/9.jpg"]} />
      <Page position={[width * 2, y + 3, z]} urls={["./img1/1.jpg", "./img1/2.jpg", "./img1/3.jpg"]} />
      <Page position={[width * 3, y + 3, z]} urls={["./img1/4.jpg", "./img1/5.jpg", "./img1/6.jpg"]} />
      */}

     
      <Page position={[width * 4, y, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/9.jpg"]} />
      <Page position={[width * 5, y, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/7.jpg"]} />
      <Page position={[width * 6, y, z]} urls={["./img1/8.jpg", "./img1/8.jpg", "./img1/7.jpg"]} />
      <Page position={[width * 7, y, z]} urls={["./img1/9.jpg", "./img1/8.jpg", "./img1/7.jpg"]} />
      <Page position={[width * 8, y, z]} urls={["./img1/1.jpg", "./img1/8.jpg", "./img1/7.jpg"]} />




      <Page position={[-width * 1, y+10, z]} urls={["./img1/1.jpg", "./img1/2.jpg", "./img1/3.jpg"]} />
      <Page position={[width * 0, y+10, z]} urls={["./img1/4.jpg", "./img1/5.jpg", "./img1/6.jpg"]} />
      <Page position={[width * 1, y+10, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/9.jpg"]} />
      <Page position={[width * 2, y+10, z]} urls={["./img1/1.jpg", "./img1/2.jpg", "./img1/3.jpg"]} />
      <Page position={[width * 3, y+10, z]} urls={["./img1/4.jpg", "./img1/5.jpg", "./img1/6.jpg"]} />
     
      <Page position={[width * 4, y+10, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/9.jpg"]} />
      <Page position={[width * 5, y+10, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/7.jpg"]} />
      <Page position={[width * 6, y+10, z]} urls={["./img1/8.jpg", "./img1/8.jpg", "./img1/7.jpg"]} />
      <Page position={[width * 7, y+10, z]} urls={["./img1/9.jpg", "./img1/8.jpg", "./img1/7.jpg"]} />
      <Page position={[width * 8, y+10, z]} urls={["./img1/1.jpg", "./img1/8.jpg", "./img1/7.jpg"]} />

    </>
  );
}






// p += 0.1*cos(scale * 3.*p.yx + time + vec2(1.2,3.4));
// p += 0.1*cos(scale * 3.7*p.yx + 1.4* time + vec2(2.2,3.4));
// p += 0.1*cos(scale * 5.*p.yx + 2.6* time + vec2(4.2,3.4));
//  p += 0.1*cos(scale * 7.*p.yx + 3.6* time + vec2(10.2,3.4));
//  p += 0.2*sin(scale / 1.*p.yx + 3.6* time + vec2(10.2,3.4));
