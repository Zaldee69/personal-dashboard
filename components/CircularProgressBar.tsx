import React, {useEffect} from 'react'
interface CircularProgressBarProps {
  percent: number
  error: boolean
}



const CircularProgressBar: React.FC<CircularProgressBarProps> = ({ percent, error }) => {
  useEffect(() => {
    const progressCircle: any = document.querySelector(".progress-circle");
    const horizontalRadius = progressCircle?.rx?.baseVal.value || null;
    const verticalRadius = progressCircle?.ry?.baseVal.value || null;
    const circumference =
      (verticalRadius + horizontalRadius - 60) * 2.7 * Math.PI;

    const setProgress = (num: number) => {
      //check if progressCircle !== null, then we will change progressCircle style
      progressCircle === null
        ? ""
        : (progressCircle.style.strokeDashoffset =
          circumference - (num / 100) * circumference);
    };
    setProgress(percent);
  }, [percent]);

  useEffect(() => {
    const track: any = document.querySelector(".track");
    //check if num != 0, track != null, and status !== "Look Straight", then we will change track stroke colors
    error ? (track.style.stroke = "#DE350B") : (track.style.stroke = "#fff");
  }, [error]);

  return (
    <svg
      preserveAspectRatio="none"
      style={{marginTop: "10px"}}
      viewBox="0 0 140 160"
      className="percent svg"
      id="percent"
    >
      <ellipse id="track" className="track" cx="50%" cy="50%" rx="51" ry="71" />
      <ellipse
        id="circle"
        className="progress-circle"
        cx="50%"
        cy="50%"
        rx="51"
        ry="71"
      />
    </svg>
  );
};

export default CircularProgressBar;
