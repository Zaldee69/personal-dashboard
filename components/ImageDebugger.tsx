import React from 'react'
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/app/store";

const ImageDebugger = () => {

    const images = useSelector((state: RootState) => state.liveness.images);

  return (
    <div className="max-w-[30%] absolute top-5 left-5" >
        {
            images.map((image) => (
                <img key={image.value} src={image.value} />
            ))
        }
    </div>
  )
}

export default ImageDebugger