var mic; // an object for the microphone input
var fft; // an object for the FFT frequency analyzer
let noiseThreshold = 0.05; // Lowered threshold to detect more sounds
let lastColor1 = [0, 0, 0];
let lastColor2 = [0, 0, 0];
let lastColor3 = [0, 0, 0];
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



function setup() {
  createCanvas(windowWidth, windowHeight);
  
  background(0);
  
   // make a microphone object:
  mic = new p5.AudioIn()
  // make an FFT sound analyzer:
  fft = new p5.FFT();
  
  // Attach a user interaction event to start audio
  userStartAudio().then(() => {
    console.log("Audio Context resumed successfully");
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

// function draw() {
//   detectAudioInput();
//   // background(lastColor[0], lastColor[1], lastColor[2]);
  
//    let rectHeight = Math.floor(height / rectSets.length); // Make sure the height is an integer

//   // Loop through all the sets and draw each set of 3 rectangles
//   for (let i = 0; i < rectSets.length; i++) {
    
//     noStroke();
    
//     let sets = rectSets[i];
//     let yOffset = i * rectHeight; // Calculate the y offset for each set

//     for (let j = 0; j < 2; j++) {
//       let baseColor = sets[j];
//       let sectionHeight = rectHeight / 2; // Height of the base rectangle
//       let sectionYOffset = yOffset + j * sectionHeight; // Y position of the base rectangle

//       // Divide the base rectangle into 4 smaller sections
//       for (let k = 0; k < 10; k++) {
//         let lerpFactor = k / 10; // Interpolate from 0 to 1 (from base color to white)
        
//         // Calculate the color for each section, interpolating from the base color to white
//         let r = lerp(baseColor[0], 255, lerpFactor);
//         let g = lerp(baseColor[1], 255, lerpFactor);
//         let b = lerp(baseColor[2], 255, lerpFactor);
        
//         fill(r, g, b);
//         // Draw each smaller box
//         rect(0, sectionYOffset + k * sectionHeight / 3, width, sectionHeight / 3);
//       }
//     }
//   }
// }

let lineX = 0; // Initial X position to start drawing from the left

function draw() {
  detectAudioInput(); // Detect new sound and update colors
  
  background(0); // Clear the screen each frame

  noStroke();

  // Loop through the rectSets and draw each set of rectangles
  for (let i = 0; i < rectSets.length; i++) {
      let { x, y, color1, color2 } = rectSets[i];

      let rectWidth = .5;
      let rectHeight = .5;

      // Apply gradient effect on first rectangle
      drawGradientRect(x, 0, rectWidth, height, color1);

      // Apply gradient effect on second rectangle (swapping x/y)
      drawGradientRect(0, y, width, rectHeight, color2);
  }

  // After drawing, add a new line to rectSets and push x by 1px
  if (rectSets.length > 0) {
    let lastRect = rectSets[rectSets.length - 1];
    lineX = lastRect.x + 1; // Move 1px left from the last added line
  }

  // Add a new set of rectangles (you may adjust the colors or logic to fit your needs)
  let newColor1 = [random(255), random(255), random(255)];
  let newColor2 = [random(255), random(255), random(255)];

  rectSets.push({ x: lineX, y: random(height), color1: newColor1, color2: newColor2 });
}

// Function to draw gradient effect for a rectangle with 3 different shades of the same color
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
  
  console.log(`Key: ${key}, ASCII: ${asciiCode}, Binary: ${binaryCode}, LastDigit: ${lastDigit}, Frequency: 1:${frequency1}, 2:${frequency2}, 3:${frequency3} Hz, Waveform: ${waveType}, Amplitude: ${amplitude1}`);
  
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


function updateColorFromSound(frequency, amplitude, energy) {
  let normFreq = map(frequency, 0, 1500, 0, 1);
  let normEnergy = map(energy, 0, 255, 0, 1);
  let normAmpHeight = map(amplitude, 0, .4, 0, height); 
  let normAmpWidth = map(amplitude, 0, .4, 0, width); 

  // Generate colors
  let r1 = map(normFreq, 0, 1, 0, 255);
  let g1 = map(sin(normFreq * PI * 10), 0, 1, 0, 255);
  let b1 = map(cos(normFreq * PI / 2), 0, 1, 0, 255);
  let color1 = [r1, g1, b1];

  let r2 = map(normEnergy, 0, 1, 200, 255);
  let g2 = map(sin(normEnergy * PI * 10), 0, 1, 200, 255);
  let b2 = map(cos(normEnergy * PI / 2), 0, 1, 200, 255);
  let color2 = [r2, g2, b2];

    // Map amplitude (0 to 0.2) to the full width of the canvas
  let x = map(amplitude, 0, 0.4, 0, width);
  let y = map(amplitude, 0, 0.4, 0, height);

  // Ensure some rectangles always start at (0,0)
  if (amplitude < 0.07) { 
    x = 0;
    y = 0;
  }


  // Store new rectangle data
  rectSets.push({ x, y, color1, color2 });

  lastAmplitude = amplitude; // Update amplitude for future use
}
let detectionCounter = 0; // Counter to keep track of sound detections

function detectAudioInput() {
  // get the mic level
  let micLevel = mic.getLevel();
  
  // analyze the sound using FFT
  let spectrum = fft.analyze();
  let peakFreq = fft.getCentroid();
  let micAmplitude = mic.getLevel();

  console.log(micAmplitude);
  let energy = fft.getEnergy(peakFreq); 

  // Threshold for sound detection
  if (micAmplitude < noiseThreshold) {
    return;
  }

  let now = millis();
  if (now - lastChangeTime < 500) return; // Prevent rapid flickering
  lastChangeTime = now;

  // Increment the detection counter each time a sound is detected
  detectionCounter++;

  // Only process every other detection (even detection count)
  // if (detectionCounter % 2 === 0 && micAmplitude > 0.05) {
  //   updateColorFromSound(peakFreq, micAmplitude, energy);
  //   generateResponseSound(peakFreq, micAmplitude, energy);
  // }

  if (micAmplitude > 0.04) {
      updateColorFromSound(peakFreq, micAmplitude, energy);
      generateResponseSound(peakFreq, micAmplitude, energy);
    }
  
  console.log(peakFreq.toFixed(2));
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

  console.log('Generating response sound at', mappedFreq, 'Hz');
}





