import { useProgress, Html } from "@react-three/drei";
export default function Loader() {
    const progress = useProgress(state => state.progress)
    console.log(progress)
    if (progress !== 100) {
      return (
        <Html center wrapperClass="wrapper">
            <div className="load-container">
                <div className="progress">
                    <div className="progress-value">

                    </div>
                </div>
            </div>
         
        </Html>
      );
    }
  
    return null
  }