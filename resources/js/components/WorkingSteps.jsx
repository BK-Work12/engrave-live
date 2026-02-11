import { useRef, useState } from "react";
import WorkingDetail from "./WorkingDetail";
import { Steps } from "../Data/Steps.js"
import { useScrollIntoView } from "./useScrollIntoView.js";

export default function WorkingSteps() {
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  const view = useScrollIntoView(containerRef)
  const progressPercent =
    view.scrollProgress > 0.6
      ? 100
      : view.scrollProgress > 0.3
        ? 60
        : 30;
  return (
    <div className="">
      <div
        ref={containerRef}
        className="container mx-auto relative"
      >
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-[#3A3A3A]" >
          <div
            className="bg-red-400 transition-all duration-300 delay-100 ease-in-out"
            style={{
              height: `${progressPercent}%`
            }} />
        </div>

        {/* Moving circle */}
        <div
          className="absolute left-1/2 delay-100 -translate-x-1/2 w-4 h-4 rounded-full bg-[#6235FD] transition-all duration-300"
          style={{
            top: `${progressPercent}%`
          }}
        />

        {/* Steps */}
        {Steps.map((Steps, i) => (
          <div
            key={i}
            className="flex even:flex-row-reverse *:w-1/2 gap-x-20 mb-47.5  items-center min-h-[400px] "
          >
            {/* LEFT */}
            <WorkingDetail
              step={Steps.step}
              title={Steps.title}
              des={Steps.des}
              active={i === activeStep}
            />

            {/* RIGHT */}
            {/* RIGHT */}
            <div
              className={`relative flex ${i === Steps.length - 1 ? "items-end" : "items-start"
                }`}
            >
              {/* Background image */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 
      ${i === Steps.length - 1 ? "-translate-x-1/4" : "translate-x-1/6"}
    `}
                style={{
                  backgroundImage: `url(${Steps.bgImage})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  width: "100%",
                  height: "100%",
                }}
              />

              {/* Foreground image */}
              <img
                src={Steps.image}
                alt={Steps.title}
                className="relative z-10"
              />
            </div>


          </div>
        ))}
      </div>
    </div>
  );
}
