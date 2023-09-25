
import React, { useState, useEffect, useRef } from "react";

import { Line } from 'react-chartjs-2';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS } from "chart.js/auto";
import myImage from './logo/background.png';
import Papa from 'papaparse';
import { io } from "socket.io-client";
import 'chartjs-plugin-annotation';
import 'font-awesome/css/font-awesome.min.css';
import html2canvas from 'html2canvas';


function Dashboard({ handlelogout }) {
    const socket = io('http://localhost:5000/');

    // State to track the active list item
    const [activeListItem, setActiveListItem] = useState(null);

    // Function to handle list item click
    const handleListItemClick = (index) => {
        setActiveListItem(index);
    }
    
    
    
    


    // state
     const [alldata1, setalldata1] = useState();
    const [vnow, setvnow] = useState();
    const [vopen, setvopen] = useState();
    const [ishort, setishort] = useState();
    const [pmax, setpmax] = useState([]);
    const [vmaxp, setvmaxp] = useState([]);
    const [imaxp, setimaxp] = useState();
    const [eff, seteff] = useState();
    const [ff, setff] = useState();
    const [powerdata, setpowerdata] = useState();
    const [ocv, setocv] = useState();
    const [scc, setscc] = useState();
    const [seconds, setSeconds] = useState(0);

    // data
    const [alldata, setalldata] = useState();
    const [current, setcurrent] = useState();
    const [voltage, setvoltage] = useState();
    const [power1, setpower1] = useState();

    const [command, setcommand] = useState(true)
    const chartRef = useRef(null);

    const booleanseconds = useRef(false)

    //graph state
    const [datas, setData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Current',
                data: [],
                fill: false,
                yAxisID: 'y',
                borderColor: 'blue',
                pointRadius: 2,
                tension: 0.4,
            },
            {
                label: 'Power',
                data: [],
                fill: false,
                yAxisID: 'y1',
                borderColor: 'red',
                pointRadius: 2,
                tension: 0.4,
            },
        ],
    });

const [var1, setvar1] = useState();
    const [var2, setvar2] = useState();
    const handle_var1 = (e) => {
        setvar1(e.target.value);
        console.log(e.target.value);
    }
    const handle_var2 = (e1) => {
        setvar2(e1.target.value)
    }

 const calculatevalues = (current1, voltage1, power2) => {
        // Ensure power2 contains only numeric values
        const numericPower2 = power2.filter(value => typeof value === 'number');
        if (numericPower2.length === 0) {
          console.error('power2 does not contain valid numeric values');
          return;
        }
      
        const powermax = Math.max(...numericPower2);
        if (isNaN(powermax)) {
          console.error('powermax is not a valid number');
          return;
        }
        setpmax(parseFloat(powermax.toFixed(3)));
      
        const indexOfMaxValue = power2.indexOf(powermax);
        if (indexOfMaxValue === -1) {
          console.error('indexOfMaxValue is -1, powermax not found in power2');
          return;
        }
        setvmaxp(parseFloat(voltage1[indexOfMaxValue].toFixed(3)));
        setimaxp(parseFloat(current1[indexOfMaxValue].toFixed(3)));
      
        const maxVoltage = Math.max(...voltage1);
        const maxCurrent = Math.max(...current1);
      
        const indexOfmaxVoltage = voltage1.indexOf(maxVoltage);
        if (indexOfmaxVoltage === -1) {
          console.error('indexOfMinVoltage is -1, maximum voltage not found in voltage1');
          return;
        }
        const indexOfmaxCurrent = current1.indexOf(maxCurrent);
        if (indexOfmaxCurrent === -1) {
          console.error('indexOfmaxCurrent is -1, minimum current not found in current1');
          return;
        }
        setocv(voltage1[indexOfmaxVoltage]);
        setscc(parseFloat(current1[indexOfmaxCurrent].toFixed(3)));
      
        const fillfact = ((powermax / (var1 * var2)) * 100).toFixed(3);
        seteff(parseFloat(fillfact));
        
        
      };
 
 useEffect(() => {
        console.log(pmax, ocv, scc);
        setff((pmax / (ocv * scc)).toFixed(3));
    }, [pmax, ocv, scc])


    const sendresponse = async () => {
        const body = { command }
        booleanseconds.current = true;
        const loader = document.getElementById("loader");
        loader.style.display = "block";
        loader.style.display = "flex";

        socket.emit('send-message-react', true)


        setTimeout(() => {
            if (booleanseconds.current) {
                receiveresponse();
            }
        }, 10000);
    }

   const exportData = () => {
  // Get the current date and format it with the India time zone (IST) in 12-hour format
  const currentDate = new Date();
  const dateOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true, // Use 12-hour format with AM/PM
    timeZoneName: 'short',
  };
  const formattedDate = currentDate.toLocaleString('en-IN', dateOptions);

  // Replace characters that are not suitable for a filename
  const sanitizedDate = formattedDate.replace(/[\s:]/g, '-');

  // Create a filename using the formatted date
  const filename = `Solar_Module_Analyser_Data_${sanitizedDate}.csv`;

  const csv = Papa.unparse(alldata);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  
        const receiveresponse = async () => {
        const loader = document.getElementById("loader");
        socket.emit('send-message-react', false)
        const response = await fetch('http://localhost:4000/api/data')
        const data = await response.json();
        setalldata(data);

        const current1 = data.map(item => item.Current);
        setcurrent(current1);

        const voltage1 = data.map(item => item.Voltage);
        setvoltage(voltage1)

        const power2 = data.map(item => item.Power);
        setpower1(power2);



        loader.style.display = "none";
        booleanseconds.current = false;
        calculatevalues(current1, voltage1, power2);
        setgraphdata(data);
    }

    const setgraphdata = (data) => {
        setData({
            labels: data.map(item => item.Voltage),
            datasets: [
                {
                    label: 'Current',
                    data: data.map(item => item.Current),
                    fill: false,
                    yAxisID: 'y',
                    borderColor: 'blue',
                    pointRadius: 2,
                    tension: 0.4,
                },
                {
                    label: 'Power',
                    data: data.map(item => item.Power),
                    fill: false,
                    yAxisID: 'y1',
                    borderColor: 'red',
                    pointRadius: 2,
                    tension: 0.4,
                },
            ],
        });
    }



    useEffect(() => {
        socket.on('message-to-react', (socketdata) => {
            console.log(socketdata);
        });
        return () => {
            socket.off('message-to-react');
        };
    }, []);


    const options = {
        plugins: {
            legend: {
                display: true,
                labels: {
                    boxWidth: 20,
                    usePointStyle: false,
                    padding: 10,
                    color: 'black',
                    font: {
                        weight: 'bold',
                    },
                    generateLabels: (chart) => {
                        const data = chart.data;
                        if (data.datasets.length) {
                            return data.datasets.map((dataset, i) => ({
                                text: dataset.label,
                                fillStyle: dataset.borderColor,
                                hidden: !chart.isDatasetVisible(i),
                                index: i,
                                datasetIndex: i,
                            }));
                        }
                        return [];
                    },
                },
            },

        },
        scales: {
            x: {

                type: "linear",
                position: "bottom",

                title: {
                    display: true,
                    text: "Voltage(V)",
                    color: 'black',
                    font: {
                        weight: '100',
                        size: "25px"
                    },
                },
                ticks: {

                    stepSize: 5,

                    color: 'black',
                    font: {
                        weight: 'bold',
                    },
                    beginAtZero: true,
                },
            },
            y: {
                beginAtZero: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Current(I)',
                    color: 'black',
                    font: {
                        weight: '100',
                        size: "25px"
                    },
                },
                ticks: {
                    stepSize: 1,
                    color: 'black',
                    font: {
                        weight: 'bold',
                    },
                },


            },
            y1: {
                grid: {
                    display: false
                },
                beginAtZero: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Power(W)',
                    color: 'black',
                    font: {
                        weight: '100',
                        size: "25px"
                    },
                },
                ticks: {
                    stepSize: 10,
                    color: 'black',
                    font: {
                        weight: 'bold',
                    },
                },
            },
        },
        grid: {
            display: false,
            borderWidth: 1,
        },
    };




  function saveImageWithTimestamp() {
  // Select the element containing the graph (assuming it's an HTML element)
  const graphElement = document.getElementById('your-graph-id'); // Replace with your actual element ID

  // Use html2canvas to capture the graph as an image
  html2canvas(graphElement)
    .then((canvas) => {
      // Convert the canvas to a data URL
      const imageDataURL = canvas.toDataURL('image/png'); // You can change the format if needed

      // Get the current date and format it with the India time zone
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // Use 12-hour format with AM/PM
        timeZone: 'Asia/Kolkata', // India time zone (IST)
      });

      // Replace characters that are not suitable for a filename
      const sanitizedDate = formattedDate.replace(/[\s:]/g, '-');

      // Create a filename using the formatted date
      const fileName = `Solar_Module_Analyser_Graph_${sanitizedDate}.png`;

      // Create an anchor element to trigger the download
      const downloadLink = document.createElement('a');
      downloadLink.href = imageDataURL;
      downloadLink.download = fileName; // Set the desired file name

      // Trigger the download
      downloadLink.click();
    })
    .catch((error) => {
      console.error('Error saving image:', error);
    });
}





    return (
        <div className="boddy">
        <div id="loader" className="loader">
                    <div className="loading"></div>
                </div>

            <div className="heading_1">
                <h5>Welcome To</h5>
            </div>
            <div className="heading_2">
                <h1>Solar Module Analyser</h1>
            </div>

            <div className="backimage">
                <img src={myImage} alt="My Image" />
            </div>

            <div className="graphs" id="graph">
                
                <div className="content d-flex">
                    <div className="graph" id="your-graph-id">
                        <h1 className="text_card">Graph</h1>
                        <Line data={datas} options={options} />
                    </div>
                    <div className="graph">
                        <h1 className="text_card">Calculation</h1>

                        <div className="inner-card">
                            <h2>Voc</h2>
                            <div className="value">{ocv}</div>
                            <div className="symbols">V</div>
                        </div>
                        <div className="inner-card">
                            <h2>Isc</h2>
                            <div className="value">{scc}</div>
                            <div className="symbols">A</div>
                        </div>

                        <div className="inner-card">
                            <h2>Pmax</h2>
                            <div className="value">{pmax}</div>
                            <div className="symbols">W</div>
                        </div>


                        <div className="inner-card">
                            <h2>Vmaxp</h2>
                            <div className="value">{vmaxp}</div>
                            <div className="symbols">V</div>
                        </div>


                        <div className="inner-card">
                            <h2>Imaxp</h2>
                            <div className="value">{imaxp}</div>
                            <div className="symbols">A</div>
                        </div>



                        <div className="inner-card">
                            <h2>Efficiency</h2>
                            <div className="value">{eff}</div>
                            <div className="symbols">%</div>
                        </div>
                        <div className="inner-card">
                            <h2>Fill Factor</h2>
                            <div className="value">{isNaN(ff) ? "" : ff}</div>
                        </div>

                    </div>


                </div>
                <br />
                <div className="buttons1">
                    <div className="sec-bar">
                        <input type="number" placeholder="Area value" value={var1} onChange={handle_var1}/>
                        <input type="number" placeholder="Irradiance" value={var2} onChange={handle_var2}/>
                        <button className={`btn-loc start ${var1 && var2 ? '' : 'disabled'}`} onClick={sendresponse} disabled={!(var1 && var2)}>
                            Start
                        </button>

                        {/* <button className="btn-loc start" onClick={sendresponse} {(var1 && var2) ? "" : disabled} >Start</button> */}
                    </div>
                    <div className="sec-bar">
                        <button className="btn-loc start btn btn-primary" onClick={exportData}>Export</button>
                    </div>
                    <div className="sec-bar" style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn-loc start btn btn-warning" onClick={saveImageWithTimestamp}>Save graph</button>
                    </div>


                </div>
            </div>

            <br />
            <div class="floating-button">
                <button onClick={handlelogout} style={{ borderRadius: "50px" }}>Log out</button>
            </div>
            <footer>
                <div className="footer-content">
                    <p>&copy; 2023 Quantanic Techsherv Pvt Ltd. All rights reserved.</p>
                </div>
            </footer>
        </div >
    )
}


export default Dashboard;
