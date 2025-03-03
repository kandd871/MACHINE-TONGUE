var mic; // an object for the microphone input
var fft; // an object for the FFT frequency analyzer
let noiseThreshold = 0.01; // Lowered threshold to detect more sounds
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
let newOsc;
let osc1, osc2, osc3;
let responseTimer = null;
let rectSets = []; // Array to hold sets of rectangles
let lastAmplitude = 0; // Track last amplitude

let newWindow = window.open('', 'consoleWindow', 'width=275,height=800');


// Set the window title
newWindow.document.title = 'CONSOLE';

newWindow.document.write(`
  <html>
    <head>
      <title>CONSOLE</title>
  <style>
    body {
      background-color: #222;
      color: #0f0;
      font-family: monospace;
      padding: 0px;
      white-space: pre-wrap;
      text-transform: uppercase;
    }
    #console {
      font-size: 10px;
      overflow-y: auto;
      // max-height:0vh;
    }
  </style>
    <div id="console"></div>
   </body>
  </html>
`);

let consoleDiv = newWindow.document.getElementById('console');

// Override console.log to print messages in the new window
console.log = function(message) {
    consoleDiv.innerHTML += message + '<br>';
    newWindow.scrollTo(0, newWindow.document.body.scrollHeight); // Auto-scroll to the latest log
};

console.log('MACHINE TONGUE INITIATED...');


function setup() {
  createCanvas(windowWidth, windowHeight);
  
  background(0);
  
   // make a microphone object:
  mic = new p5.AudioIn()
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
}

let lineX = 0;

let soundDetected = false; // Flag to track sound detection

function draw() {
  detectAudioInput(); // Detect new sound and update colors

  // Only update the canvas if a sound was detected
  if (soundDetected) {
    background(0); // Clear the screen each frame

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
}



function drawGradientRect(x, y, rectWidth, rectHeight, baseColor) {
  let numSteps = 3; // Number of gradient divisions

  for (let k = 0; k < numSteps; k++) {
    // Slightly adjust the color by adding/subtracting small values
    let shadeFactor = map(k, 0, numSteps - 1, -15, 15); // Control how much variation there is in the shade

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
}

function keyPressed() {
  // if (!started) started = true;

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
  let frequency3 = map(decimalValue3, -1, 1, 1200, 1400);

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
  // isPlaying = true;

  // updateColorFromSound(frequency);

  if (responseTimer) clearTimeout(responseTimer);
  
  console.log(`KEY PRESSED BY HUMAN ---> ${key}, ASCII: ${asciiCode}; BINARY: ${binaryCode}; FREQUENCY1:${frequency1.toFixed(2)}; FREQUENCY2:${frequency2.toFixed(2)}; FREQUENCY3:${frequency3.toFixed(2)} Hz, WAVEFORM: ${waveType}, AMPLITUDE; ${amplitude1.toFixed(2)}`);
  
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
  // get the mic level
  let micLevel = mic.getLevel();
  
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

  // Only process every other detection (even detection count)
  if (detectionCounter % 2 === 0 && micAmplitude > 0.05) {
    updateColorFromSound(peakFreq, micAmplitude, energy);
    generateResponseSound(peakFreq, micAmplitude, energy);
  }
  
  console.log(`SPEECH RECEIVED ---> PEAK FREQUENCY: ${peakFreq.toFixed(2)}; ENERGY: ${energy.toFixed(2)}`);
}


function updateColorFromSound(frequency, amplitude, energy) {
  let normFreq = map(frequency, 500, 8000, 0, 1);
  let normEnergy = map(energy, 0, 255, 0, 1);
  let normAmpHeight = map(amplitude, 0, .4, 0, height); 
  let normAmpWidth = map(amplitude, 0, .4, 0, width); 

  // Generate colors
  let r1 = map(normFreq, 0, 1, 0, 255);
  let g1 = map(sin(normFreq * PI * 10), -1, 1, 20, 255);
  let b1 = map(cos(normFreq * PI / 2), -1, 1, 20, 255);
  let color1 = [r1, g1, b1];

  let r2 = map(normEnergy, 0, 1, 0, 155);
  let g2 = map(sin(normEnergy * PI * 10), -1, 1, 0, 155);
  let b2 = map(cos(normEnergy * PI / 2), -1, 1, 0, 155);
  let color2 = [r2, g2, b2];

    // Map amplitude (0 to 0.2) to the full width of the canvas
  let x = lineX;

  let y = constrain(amplitude, 0, .35);
  y = map(amplitude, 0, 0.35, 0, height);

  // Ensure some rectangles always start at (0,0)
  if (amplitude < 0.05) { 
    y = 0;
  }

  console.log(`NORM FREQUENCY: ${normFreq}; NORM ENERGY: ${normEnergy}`);

  // Store new rectangle data
  rectSets.push({ x, y, color1, color2 });

  console.log(`WRITING RESPONSE ---> STRINGCOLORX: (${color1[0].toFixed(0)}; ${color1[1].toFixed(0)}; ${color1[2].toFixed(0)}); STRINGCOLORY:(${color2[0].toFixed(0)}; ${color2[1].toFixed(0)}; ${color2[2].toFixed(0)}); AMPLITUDE: ${amplitude.toFixed(2)}; YSTRING-VALUE: ${y}`)

  lastAmplitude = amplitude; // Update amplitude for future use
}

function generateResponseSound(frequency, amplitude, energy) {
  // Ensure peakFreq is within a reasonable range
  frequency = constrain(frequency, 20, 1500); // Constrain within human hearing range
  
  // Map the frequency to desired range
  let mappedFreq = map(frequency, 20, 1500, 100, 1400);

  // Ensure amplitude remains smooth
  let newAmplitude = map(amplitude, 0, 1, 0.75, 1);

  // Set frequency and amplitude for the response sound
  newOsc.freq(mappedFreq);
  newOsc.amp(newAmplitude, 0.1);

  // Fade out after 1 second
  setTimeout(() => {
    newOsc.amp(0, 0.1);
  }, 200);

  console.log(`SPEAKING RESPONSE AT ---> ${mappedFreq.toFixed(2)} HZ`);
}





