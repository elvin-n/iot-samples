

var mraa = require('mraa'); //require mraa
//console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

//initalization of the motors
function MotorController () {
  this.CON_MOTOR1 = 1;
  this.CON_MOTOR2 = 0;

  this.FORWARD = 0;
  this.BACKWARD = 1;
  this.LEFT = 2;
  this.RIGHT = 3;
  
  this.speed1Pin = null;
  this.dir1Pin = null;
  this.speed2Pin = null;
  this.dir2Pin = null;
}

MotorController.prototype.init = function(speed1Pin, dir1Pin, speed2Pin, dir2Pin) {
  this.speed1Pin = new mraa.Gpio(speed1Pin);
  this.speed1Pin.dir(mraa.DIR_OUT);
  this.dir1Pin = new mraa.Gpio(dir1Pin);
  this.dir1Pin.dir(mraa.DIR_OUT);
  this.speed2Pin = new mraa.Gpio(speed2Pin);
  this.speed2Pin.dir(mraa.DIR_OUT);
  this.dir2Pin = new mraa.Gpio(dir2Pin);
  this.dir2Pin.dir(mraa.DIR_OUT);
};

MotorController.prototype.go = function(newDirection, speed) {
  var motorDirection_1, motorDirection_2;
 
  switch ( newDirection ) {
    case this.FORWARD:
        motorDirection_1 = true;
        motorDirection_2 = true;
        break;
    case this.BACKWARD:
        motorDirection_1 = false;
        motorDirection_2 = false;
        break;        
    case this.LEFT:
        motorDirection_1 = true;
        motorDirection_2 = false;
        break;
    case this.RIGHT:
        motorDirection_1 = false;
        motorDirection_2 = true;
        break;    
  }
 
  // correction according to the plug of the motors to the motor controlling
  // board. if we missed up the contacts, we need to change CON_MOTOR1 variable
  motorDirection_1 = this.CON_MOTOR1 ^ motorDirection_1;
  motorDirection_2 = this.CON_MOTOR2 ^ motorDirection_2;
 
  // sending signals to the motors
  this.speed1Pin.write(speed);
  this.speed2Pin.write(speed);
 
  this.dir1Pin.write(motorDirection_1);
  this.dir2Pin.write(motorDirection_2);
};

MotorController.prototype.goForward = function(speed) {
  this.go(this.FORWARD, speed);
};

MotorController.prototype.goLeft = function(speed) {
  this.go(this.LEFT, speed);
};

MotorController.prototype.goRight = function(speed) {
  this.go(this.RIGHT, speed);
};


MotorController.prototype.stopMotors = function() {
  this.speed1Pin.write(0);
  this.speed2Pin.write(0);
  this.dir1Pin.write(0);
  this.dir2Pin.write(0); 
};


function LineSensor (pin) {
  this.pin = pin;
  this.analogPin = new mraa.Aio(pin);
  //this.analogPin.dir(mraa.DIR_IN);
}

LineSensor.prototype.read = function() {
  return this.analogPin.read();
};

var leftSensor = new LineSensor(1);
var rightSensor = new LineSensor(0);
var motorController = new MotorController();
motorController.init(5, 4, 6, 7);
var robotGo = false;

function goLine(blackLine) {
  if (!robotGo) {
    return;
  }
  var rv = rightSensor.read();
  var lv = leftSensor.read();
  console.log('lv: ' + lv + 'rv: ' + rv);
  if (rv < 600 || lv < 600) {
    if (rv > 600) {
      motorController.goRight(50);
      console.log('turned right');
    } else if (lv > 600) {
      motorController.goLeft(50);
      console.log('turned left');
    } else {
      motorController.goForward(250);
    }
    setTimeout(function() {
        goLine(blackLine);
      }, 10);
  } else {
    motorController.stopMotors();
  }
}


var btnCtrlPin = new mraa.Gpio(12);
btnCtrlPin.dir(mraa.DIR_IN);

function checkButton() {
  var valBtn = btnCtrlPin.read();
  console.log(valBtn);
  if (valBtn == 1) {
    if (robotGo) {
      robotGo = false;
      motorController.stopMotors();
    } else {
      robotGo = true;
      setTimeout(function() {
          goLine(true);
        }, 200);
    }
  } 
}

setInterval(checkButton, 200);