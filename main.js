var mic; // an object for the microphone input
var fft; // an object for the FFT frequency analyzer
let noiseThreshold = 0.0025; // Lowered threshold to detect more sounds
let ampThreshold = 0.003; // Lowered threshold to detect more sounds
let lastColor1 = [0, 0, 0];
let lastColor2 = [0, 0, 0];
let lastColor3 = [0, 0, 0];
let color1 = [0, 0, 0];
let color2 = [0, 0, 0];
let lastChangeTime = 0;
let newSoundActive = false;
let lastFreq = 0;
let direction = 1;
let newOscAmp = 0;
let newOsc1,  newOsc2,  newOsc3;
let osc1, osc2, osc3;
let responseTimer = null;
let rectSets = []; // Array to hold sets of rectangles
let lastAmplitude = 0; // Track last amplitude
let consoleColorX;
let consoleColorY;
let borderColor;
let consoleDiv = document.getElementById('console');
let firstXpos;
let isPlaying = false; // Add this at the top with your other variable declarations

let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

let startTime = null;
let timerInterval = null;
const timerElement = document.getElementById("timer");

let timeSpent = { machine: 0, human: 0, unknown: 0 };
let currentState = "unknown"; // Default to unknown until input is detected
let lastUpdateTime;


let classifier;
let predictedSound = "";
// const modelJson = "https://teachablemachine.withgoogle.com/models/q6xZw5sAA/";
const modelJson = "https://teachablemachine.withgoogle.com/models/oU1fsCw_m/";

function preload() {
  // Load Teachable Machine model
  classifier = ml5.soundClassifier(modelJson);
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // background(0);
  clear();
  
   // make a microphone object:
  mic = new p5.AudioIn();
  // make an FFT sound analyzer:
  fft = new p5.FFT();
  
  // Attach a user interaction event to start audio
  userStartAudio().then(() => {
    // console.log("Audio Context resumed successfully");
    mic.start();
  }).catch(e => {
    console.error("Failed to start audio:", e);
  });

  // set the mic as the input to the analyzer:
  fft.setInput(mic);
  
  osc1 = new p5.Oscillator('sine');
  osc1.start();
  osc1.amp(0);
  
  osc2 = new p5.Oscillator('sine');
  osc2.start();
  osc2.amp(0);
  
  osc3 = new p5.Oscillator('sine');
  osc3.start();
  osc3.amp(0);
  
  newOsc = new p5.Oscillator();
  newOsc.start();
  newOsc.amp(0);


    // Classify the sound from microphone in real time
    classifier.classifyStart(gotResult);
  
  if (isMobile) {
    // Start microphone input automatically on mobile
    userStartAudio().then(() => {
      noiseThreshold = 0.001; 
      ampThreshold = 0.002; 
      mic.start();
      machineTongueInitiated = true; 
    }).catch(e => {
      console.error("Failed to start audio:", e);
    });
  } else {
    // console.log("PRESS A KEY TO INITIATE A CONVERSATION IN MACHINE TONGUE...");
    console.log("MACHINE TONGUE is a generative language created for machines by machines.");

    console.log("PRESS A KEY TO INITIATE A CONVERSATION IN MACHINE TONGUE.");
  }
}

function startConsole(){
  
}


function startTimer() {
  startTime = performance.now(); // More accurate than Date.now()
  lastUpdateTime = startTime;

  timerInterval = setInterval(() => {
    let now = performance.now();
    let elapsedTime = now - startTime;

    // Update the time spent in the current state
    timeSpent[currentState] += now - lastUpdateTime;
    lastUpdateTime = now;

    let minutes = Math.floor(elapsedTime / 60000);
    let seconds = Math.floor((elapsedTime % 60000) / 1000);
    let milliseconds = Math.floor((elapsedTime % 1000) / 10); // Convert to two-digit format

    // Format time as MM:SS:MS (two digits for milliseconds)
    let formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;

    // Safely access the timer element
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.innerText = formattedTime;
    }

    // Calculate conversation percentages
    let totalTime = Object.values(timeSpent).reduce((a, b) => a + b, 0);
    
    // Avoid division by zero
    if (totalTime > 0) {
      let percentages = {
        machine: ((timeSpent.machine / totalTime) * 100).toFixed(0),
        human: ((timeSpent.human / totalTime) * 100).toFixed(0),
        unknown: ((timeSpent.unknown / totalTime) * 100).toFixed(0),
      };

      // Safely update the display with real-time percentages
      const introElement = document.getElementById('percentage');
      if (introElement) {
        introElement.innerHTML = `
          ${percentages.machine}% MACHINE; ${percentages.human}% HUMAN; ${percentages.unknown}% UNKNOWN
        `;
      }
    }
  }, 10); // Update every 10 milliseconds
}

function switchState(newState) {
  if (!newState || !['machine', 'human', 'unknown'].includes(newState)) {
    newState = 'unknown'; // Default to unknown if invalid state
  }
  
  let now = performance.now();
  
  // Make sure lastUpdateTime is initialized
  if (lastUpdateTime === undefined) {
    lastUpdateTime = now;
    return;
  }
  
  // Only update if the state is changing
  if (currentState !== newState) {
    // Add the time spent in the previous state
    timeSpent[currentState] += now - lastUpdateTime;
    lastUpdateTime = now;
    currentState = newState;
    
    // Debug info
    // console.log(`Switched to ${newState} state. Current time splits: Machine: ${timeSpent.machine.toFixed(0)}ms, Human: ${timeSpent.human.toFixed(0)}ms, Unknown: ${timeSpent.unknown.toFixed(0)}ms`);
  }
}


function resetTimer() {
  clearInterval(timerInterval);
  document.getElementById('timer').innerText = "00:00:00";
}

if (!isMobile) {
const defaultConsoleLog = console.log; // Store the original log function

console.log = function (message, color = `${consoleColorX}`, color2 = `${consoleColorY}`) {
  // If called from windowResized(), use default console.log
  if (new Error().stack.includes("windowResized")) {
    defaultConsoleLog(message);
    return;
  }

  let logClass = '';
  let noiseDetected = '';
  let textColor = '';
  let borderColor = '';

  const msgString = String(message);

  if (msgString.includes("...") || msgString.includes("generative") || msgString.includes("ENDED")) {
    logClass = color;
    noiseDetected = 'noise-detected';
    textColor = 'black';
    borderColor = color;
  } else if (msgString.includes("KEY PRESSED")) {
    textColor = '#66FF66';
    borderColor = '#66FF66';
  } else {
    textColor = color;
    borderColor = color2;
  }

  consoleDiv.innerHTML += `<div class="log-entry ${logClass} ${noiseDetected}" style="color: ${textColor}; border-bottom: 5px solid ${borderColor}; background-color: ${logClass};">${msgString}</div>`;

  consoleDiv.scrollTop = consoleDiv.scrollHeight;
};
}


let lineX = 0;

let soundDetected = false; // Flag to track sound detection

function draw() {
  detectAudioInput(); // Detect new sound and update colors
  // Only update the canvas if a sound was detected
  if (soundDetected) {
    // background(0); 
    clear();

    noStroke();

    // Loop through rectSets in reverse so item[0] is furthest to the right
    for (let i = 0; i < rectSets.length; i++) {
      let { x, y, color1, color2 } = rectSets[i];

      let rectWidth = 0.5;
      let rectHeight = 1.5;

      // Apply gradient effect on first rectangle
      drawGradientRect(x, 0, rectWidth, height, color1);

      // Apply gradient effect on second rectangle (swapping x/y)
      drawGradientRect(0, y, width, rectHeight, color2);
    }

    // Shift existing rectangles to the right
    for (let i = 0; i < rectSets.length; i++) {
      rectSets[i].x += 1; // Move each rectangle 1px to the right
    }

    // Add the new rectangle at x = 0
    rectSets.unshift({ x: 0, color1, color2 });
    // Reset sound detection flag
    soundDetected = false;
  }

   // Get first rectangle’s x position safely
   if (rectSets.length > 0) {
    firstXpos = rectSets.length;


    if (firstXpos >= (width*2)) {
      rectSets = []; // Clear canvas
      console.log('CONVERSATION ENDED.', 'color: #66FF66');
    }
  }

}

function generateRandomShadeOrder(numSteps) {
  // Generate an array of shade factors from -15 to 15
  let shadeFactors = [];
  for (let k = 0; k < numSteps; k++) {
    shadeFactors.push(map(k, 0, numSteps - 1, 0, 15));
  }

  // Shuffle the shade factors to create randomness
  shuffle(shadeFactors, true);
  return shadeFactors;
}

function drawGradientRect(x, y, rectWidth, rectHeight, baseColor) {
  let numSteps = 3; // Number of gradient divisions
  // Get a new random shade order each time the gradient is drawn
  let shadeFactors = generateRandomShadeOrder(numSteps);

  // Apply the random shades for this line
  for (let k = 0; k < numSteps; k++) {
    let shadeFactor = shadeFactors[k];

    // Adjust the base color by a small amount for each shade
    let r = constrain(baseColor[0] + shadeFactor, 0, 255);
    let g = constrain(baseColor[1] + shadeFactor, 0, 255);
    let b = constrain(baseColor[2] + shadeFactor, 0, 255);

    fill(r, g, b);
    rect(x, y + (k * rectHeight / numSteps), rectWidth, rectHeight / numSteps);
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  console.log(width);
}

let machineTongueInitiated = false; // Flag to track first key press

function keyPressed() {
  // if (!started) started = true;

  if (keyCode === ESCAPE || keyCode === BACKSPACE) {
    rectSets = []; // Clear canvas
    machineTongueInitiated = false; // Reset state
    console.log('CONVERSATION ENDED. PRESS A KEY TO START A NEW ONE.', 'color: #66FF66');
    resetTimer();
    // Reset timeSpent and update percentages
    timeSpent = { machine: 0, human: 0, unknown: 0 };
    return;
  }

  if (!machineTongueInitiated) {
    console.log('MACHINE TONGUE INITIATED...');
    machineTongueInitiated = true; 
    if (!isMobile) {
    startConsole();
    startTimer();
    }
  }
  let asciiCode = key.charCodeAt(0);
  let binaryCode = asciiCode.toString(2);
  
  let firstTwoDigits = binaryCode.substring(0, 2); 
  let secondTwoDigits = binaryCode.substring(2, 4); 
  let thirdTwoDigits = binaryCode.substring(4, 6); 
  let lastDigit = binaryCode.substring(6); 
  
  let decimalValue1 = cos(firstTwoDigits); 
  let decimalValue2 = sin(secondTwoDigits); 
  let decimalValue3 = tan(thirdTwoDigits); 
  decimalValue3 = atan(decimalValue3) / (PI / 2); // Normalize to -1to1
  decimalValue3 = constrain(decimalValue3, -1, 1);

  
  let frequency1 = map(decimalValue1, -1, 1, 0, 300);
  let frequency2 = map(decimalValue2, -1, 1, 600, 900);
  let frequency3 = map(decimalValue3, -1, 1, 1200, 1500);

  let amplitude1 = cos(lastDigit);

  let waveType = getWaveType(asciiCode);
  
  osc1.setType(waveType);
  osc1.freq(frequency1);
  osc1.amp(amplitude1, 0.1);
  
  osc2.setType(waveType);
  osc2.freq(frequency2);
  osc2.amp(amplitude1, 0.1);
  
  osc3.setType(waveType);
  osc3.freq(frequency3);
  osc3.amp(amplitude1, 0.1);
  isPlaying = true;

  if (responseTimer) clearTimeout(responseTimer);

  
  console.log(`KEY PRESSED ---> ${key}; ASCII: ${asciiCode}; BINARY: ${binaryCode}; LOW FREQUENCY EMITTED: ${frequency1.toFixed(2)} HZ; MID FREQUENCY EMITTED: ${frequency2.toFixed(2)}; HIGH FREQUENCY EMITTED: ${frequency3.toFixed(2)} Hz, WAVEFORM: ${waveType}, AMPLITUDE: ${amplitude1.toFixed(2)}`);
  
}

function keyReleased() {
  osc1.amp(0, 0.1);
  osc2.amp(0, 0.1);
  osc3.amp(0, 0.1);
  setTimeout(() => isPlaying = false, 300);
}

function getWaveType(asciiCode) {
  if (asciiCode % 4 === 0) return 'sine';
  if (asciiCode % 4 === 1) return 'triangle';
  if (asciiCode % 4 === 2) return 'square';
  return 'sawtooth';
}



let detectionCounter = 0; // Counter to keep track of sound detections

function detectAudioInput() {
  
  // analyze the sound using FFT
  let spectrum = fft.analyze();
  let peakFreq = fft.getCentroid();
  let micAmplitude = mic.getLevel();

  peakFreq = constrain(peakFreq, 0, 8000);

  // console.log(micAmplitude);
  let energy = fft.getEnergy(peakFreq); 

  // Threshold for sound detection
  if (micAmplitude < noiseThreshold) {
    return;
  }

  let now = millis();
  if (now - lastChangeTime < 500) return; // Prevent rapid flickering
  lastChangeTime = now;

  soundDetected = true;

  if (machineTongueInitiated){
  // Only process every other detection (even detection count)
  if (micAmplitude > ampThreshold) {
    updateColorFromSound(peakFreq, micAmplitude, energy);
    generateResponseSound(peakFreq, micAmplitude, energy);
  }
  }
}

function updateColorFromSound(frequency, amplitude, energy) {
  let normFreq = map(frequency, 50, 8500, 0, 1);
  let normEnergy = map(energy, 0, 255, 0, 1);
  let normAmpHeight = map(amplitude, 0, 0.4, 0, height); 
  let normAmpWidth = map(amplitude, 0, 0.4, 0, width); 
  amplitude = constrain(amplitude, 0, 0.4)

  let r1, g1, b1;
  let r2, g2, b2;

  if (predictedSound == "Machine-Made") {
    r1 = map(normFreq, 0, 1, 100, 245);
    g1 = map(sin(normFreq * PI * 10), -1, 1, 100, 245);
    b1 = map(cos(normFreq * PI / 2), -1, 1, 100, 245);

    r2 = map(amplitude, 0, 0.4, 75, 125);
    g2 = map(sin(amplitude), -1, 1, 75, 125);
    b2 = map(cos(amplitude), -1, 1, 75, 125);

  } else if (predictedSound == "Human-Made") {
    r1 = map(cos(normFreq * PI * 10), -1, 1, 40, 100);
    g1 = map(normFreq, 0, 1, 40, 100);
    b1 = map(sin(normFreq * PI / 2), -1, 1, 40, 100);

    r2 = map(amplitude, 0, 0.4, 40, 70);
    g2 = map(amplitude, 0, 0.4, 40, 70);
    b2 = map(amplitude, 0, 0.4, 40, 70);

  } else if (predictedSound == "Background Noise"){
    r1 = map(sin(normFreq * PI / 3), -1, 1, 10, 40);
    g1 = map(cos(normFreq * PI * 3), -1, 1, 10, 40);
    b1 = map(normFreq, 0, 1, 10, 40);

    r2 = map(amplitude, 0, 0.4, 10, 40);
    g2 = map(amplitude, 0, 0.4, 10, 40);
    b2 = map(amplitude, 0, 0.4, 10, 40);
  }

  let color1 = [r1, g1, b1];
  let color2 = [r2, g2, b2];

  consoleColorX = `rgb(${Math.floor(r1)}, ${Math.floor(g1)}, ${Math.floor(b1)})`;
  consoleColorY = `rgb(${Math.floor(r2)}, ${Math.floor(g2)}, ${Math.floor(b2)})`;

  if (predictedSound == "Machine-Made") {
    console.log('Machine speaking...')
    switchState("machine");
  } else if (predictedSound == "Human-Made") {
    console.log('Human speaking...');
    switchState("human");
  } else if (predictedSound == "Background Noise"){
    console.log('Unknown speaking...');
    switchState("unknown");
  } else {
    console.log('Unknown speaking...');
    switchState("unknown");
  }

  // Map amplitude (0 to 0.2) to the full width of the canvas
  let x = lineX;
  y = constrain(normEnergy, 0, 1);
  y = map(normEnergy, 0, 1, 0, height); 

  // Focus 0.01 - 0.03 in the middle of the canvas
  // if (amplitude >= 0.005 && amplitude <= 0.02) {
  //   y = map(amplitude, 0.01, 0.03, height * 0.1, height * 0.9); // Center range
  // } else if (amplitude < 0.005) {
  //   y = map(amplitude, 0, 0.01, 0, height * 0.1); // Lower amplitudes below mid
  // } else {
  //   y = map(amplitude, 0.03, 0.5, height * 0.9, height); // Higher amplitudes above mid
  // }
  if (normEnergy >= 0.05 && normEnergy <= 0.5) {
    y = map(normEnergy, 0.05, 0.5, height * 0.1, height * 0.9); // Center range
  } else if (normEnergy < 0.05) {
    y = map(normEnergy, 0, 0.05, 0, height * 0.1); // Lower amplitudes below mid
  } else {
    y = map(normEnergy, 0.5, 1, height * 0.9, height); // Higher amplitudes above mid
  }
  
  console.log(`SPEECH RECEIVED ---> PEAK FREQUENCY: ${frequency.toFixed(2)} HZ; ENERGY: ${energy.toFixed(2)}; AMPLITUDE: ${amplitude.toFixed(2)}`);

  console.log(`NORMALIZED FREQUENCY: ${normFreq.toFixed(2)} HZ; NORMALIZED ENERGY: ${normEnergy.toFixed(2)}`);

  // Store new rectangle data
  rectSets.push({ x, y, color1, color2 });

  console.log(`WRITING RESPONSE ---> X-STRING-COLOR: rgb(${color1[0].toFixed(0)}, ${color1[1].toFixed(0)}, ${color1[2].toFixed(0)}), Y-STRING-COLOR: rgb(${color2[0].toFixed(0)}, ${color2[1].toFixed(0)}, ${color2[2].toFixed(0)}), Y-STRING-VALUE: ${y.toFixed(2)}`, `${consoleColorX}`, `${consoleColorY}`);

  lastAmplitude = amplitude; // Update amplitude for future use
}

function generateResponseSound(frequency, amplitude, energy) {
  // Ensure peakFreq is within a reasonable range
  frequency = constrain(frequency, 20, 8500); // Keep full range within hearing

  // Create three frequency ranges based on the input frequency
  let frequency1 = map(frequency, 20, 8500, 0, 499);
  let frequency2 = map(frequency, 20, 8500, 500, 900);
  let frequency3 = map(frequency, 20, 8500, 901, 3000);

  // Determine waveType based on energy value
  let waveTypeIndex = Math.floor(map(energy, 0, 255, 0, 4));
  let waveType;
  if (waveTypeIndex === 0) waveType = 'sine';
  else if (waveTypeIndex === 1) waveType = 'triangle';
  else if (waveTypeIndex === 2) waveType = 'square';
  else waveType = 'sawtooth';

  // Ensure amplitude remains smooth
  let newAmplitude = map(amplitude, 0, 1, 1, 2); // Reduced amplitude for less jarring sound

  // Set frequency and amplitude for the response sounds
  setTimeout(() => {
    osc1.setType(waveType);
    osc1.freq(frequency1);
    osc1.amp(newAmplitude, 0.1);

    osc2.setType(waveType);
    osc2.freq(frequency2);
    osc2.amp(newAmplitude, 0.1);

    osc3.setType(waveType);
    osc3.freq(frequency3);
    osc3.amp(newAmplitude, 0.1);
    
    isPlaying = true;
  }, 100);
  
  // Fade out after a short period
  setTimeout(() => {
    osc1.amp(0, 0.1);
    osc2.amp(0, 0.1);
    osc3.amp(0, 0.1);
    setTimeout(() => isPlaying = false, 100);
  }, 300);

  console.log(`SPEAKING RESPONSE AT ---> LOW: ${frequency1.toFixed(2)} HZ, MID: ${frequency2.toFixed(2)} HZ, HIGH: ${frequency3.toFixed(2)} HZ, WAVEFORM: ${waveType}`);
}


// A function to run when we get any errors and the results
function gotResult(results) {
  // The results are in an array ordered by confidence.
  // console.log(results);
  // Store the first label
  if (results[0].confidence > 0.75) {
    predictedSound = results[0].label;
  }
}
