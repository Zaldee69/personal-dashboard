const dom: { log: HTMLDivElement | undefined, status: HTMLDivElement | undefined, perf: HTMLDivElement | undefined } = { log: undefined, status: undefined, perf: undefined };

export const log = (...msg: any) => {
  if (typeof document !== 'undefined') {
    const track : any = document.querySelector(".track");
    if (!dom.log) dom.log = document.getElementById('log') as HTMLDivElement;
    dom.log.innerText = msg[0]
    dom.log.style.color = "rgba(107, 119, 140, 1)"
    track.style.stroke = "#fff"
    if(msg[0] === "Dekatkan wajah Anda" || msg[0] === "Move your face closer"){
        dom.log.style.color = "#FF5630"
        track.style.stroke = "#DE350B"
    }
    if(!dom.perf) dom.perf = document.getElementById("perf") as HTMLDivElement;
    dom.perf.innerText = msg[1] === undefined ? "" : msg[1]
  }
};