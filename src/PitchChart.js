import "./PitchChart.css";
import { Line }                        from "react-chartjs-2";
import WHITE_WINTER_HYMNAL             from "./white-winter-hymnal.json";
import {
    CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, LogarithmicScale,
    PointElement, Title, Tooltip,
}                                      from "chart.js";
import { TET12Axis }                   from "./TET12Axis.js";
import ChartDataLabels                 from "chartjs-plugin-datalabels";
import { useEffect, useRef, useState } from "react";


ChartJS.register(CategoryScale,
    LogarithmicScale,
    TET12Axis,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels,
    Filler,
);


export const notes = [
    {
        name: "C", frequency: 130.81,
    }, {
        name: "C#/Db", frequency: 138.59,
    }, {
        name: "D", frequency: 146.83,
    }, {
        name: "D#/Eb", frequency: 155.56,
    }, {
        name: "E", frequency: 164.81,
    }, {
        name: "F", frequency: 174.61,
    }, {
        name: "F#/Gb", frequency: 185.00,
    }, {
        name: "G", frequency: 196.00,
    }, {
        name: "G#/Ab", frequency: 207.65,
    }, {
        name: "A", frequency: 220.00,
    }, {
        name: "A#/Bb", frequency: 233.08,
    }, {
        name: "B", frequency: 246.94,
    },
    {
        name: "C", frequency: 261.82,
    },
];


const song = WHITE_WINTER_HYMNAL.reduce((data, { note, lyrics, beats }) => {
    const frequency = notes.find(({ name }) => note === name)?.frequency;
    const [start, end] = beats;

    return [
        ...data,
        { x: start, y: frequency, label: "" },
        { x: start + (end - start)/2, y: frequency, label: lyrics },
        { x: end, y: frequency, label: "" },
    ];
}, []);

const options = {
    plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
    },
    events: [],
    scales: {
        x: {
            type: "linear", display: true, ticks: {
                display: false,
            }, grid: {
                display: false,
            },
        }, y: {
            type: "tet-12", grid: {
                borderDash: [1, 8],
                drawBorder: false,
                drawTicks: false,
                lineWidth: 0.3,
                color: "#ECEFF4",

            }, ticks: {
                color: "#81A1C1", font: {
                    size: "16rem", weight: "bold",
                },
                callback: (value, index, ticks) => notes[index].name,
                padding: 16,
            },
            max: 261.82, // [17.09.22 | os] TODO: to be calculated
            min: 130.81, // [17.09.22 | os] TODO: to be calculated
        },
    },
};

const BPM = 40;
const SONG_LENGTH = 8;
const MINUTE = 1000*60;

function PitchChart() {
    const audioContext = useRef();
    const analyzer = useRef(); // [18.09.22 | os] TODO: increase
    // const dataArray = useRef(new Uint8Array(analyzer.current.frequencyBinCount))
    const frequency = useRef();
    const beat = useRef();
    const [currentFrequency, setCurrentFrequency] = useState();
    const startTime = useRef();
    const [singingData, setSingingData] = useState([]);
    const playAnimationFrame = useState;

    const play = () => {
        beat.current = (Date.now() - startTime.current)*BPM/MINUTE;

        if (beat.current >= SONG_LENGTH) {
            return cancelAnimationFrame(playAnimationFrame.current);
        }

        setSingingData((singingData) => [...singingData, { x: beat.current, y: frequency.current }]);


        playAnimationFrame.current = requestAnimationFrame(play);
    };
    const start = () => {
        startTime.current = Date.now();
        play();
    };


    useEffect(() => {
        const visualize = () => {
            const dataArray = new Uint8Array(analyzer.current.frequencyBinCount);
            analyzer.current.getByteFrequencyData(dataArray);

            const bin = dataArray.indexOf(Math.max(...dataArray));

            let recordedFrequency = bin*24000/analyzer.current.frequencyBinCount;

            while (recordedFrequency > 262) {
                recordedFrequency = recordedFrequency/2;
            }


            if (recordedFrequency > 0) {
                frequency.current = recordedFrequency;
                setCurrentFrequency(recordedFrequency);
            }

            requestAnimationFrame(visualize);
        };

        navigator.mediaDevices.getUserMedia({ audio: true })
                 .then((stream) => {
                     audioContext.current = new (window.AudioContext
                                                 ?? window.webkitAudioContext)();
                     analyzer.current = audioContext.current.createAnalyser();
                     analyzer.current.fftSize = 32768;
                     // analyzer.current.minDecibels = -50;
                     // analyzer.current.maxDecibels = -10;
                     audioContext.current.createMediaStreamSource(stream).connect(analyzer.current);
                     visualize();
                 })
                 .catch((err) => {
                     console.log("err:\t", err);
                     alert("Oh no, this can't work without microphone... 🐨");
                 });
    }, []);


    const data = {
        // labels: ["Hello", "There"],
        // labels: song.map(({lyrics}) => lyrics),
        datasets: [
            {
                datalabels: {
                    color: "#B48EAD", textAling: "center",
                    font: {
                        size: 20,
                    },
                    align: "top",
                }, data: song, borderColor: "#81A1C1", borderWidth: 2, pointRadius: 0, tension: 0.1,
            }, {
                animation: {
                    duration: 0,
                },
                datalabels: { display: false },
                fill: { target: "-1" },
                // data: song.map(({x, y}) => ({x, y: y + (Math.random() - 0.5)*60})),
                data: singingData,
                // data: [...frequency > 155.56 ? [{ y: frequency, x: 4 }] : []],

                // borderDash: [3,3],
                borderColor: "#B48EAD",
                borderWidth: 1,
                pointRadius: singingData.map(({ y }, i) => i === singingData.length - 1 && (y
                                                                                            > 155.56 ?
                                                                                            6 :
                                                                                            0)),
                pointFill: true,
                pointBorderWidth: 3,
                pointBorderDash: [1, 1],
                pointBorderColor: "#B48EAD",
                pointBackgroundColor: "#ECEFF4",
                tension: 0.1,
            }, {
                animation: {
                    duration: 0,
                },
                datalabels: { display: false },
                data: [{ x: 0, y: currentFrequency }, { x: SONG_LENGTH, y: currentFrequency }],
                borderColor: "#B48EAD",
                borderWidth: 1,
                pointRadius: 0,
                borderDash: [5, 2],

            },

        ],
    };

    return <section id={"pitch-chart"}>
        {/*<h1>{currentFrequency}</h1>*/}
        {/*<h1>{beat.current}</h1>*/}
        <button id={"start-button"} onClick={start}>▶️</button>
        <Line options={options} data={data}/>
    </section>;
}

export default PitchChart;


// Reading: http://joesul.li/van/tale-of-no-clocks/



