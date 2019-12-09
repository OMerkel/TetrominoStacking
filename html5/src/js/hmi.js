/**
 * @file hmi.js
 * @author Oliver Merkel <Merkel(dot)Oliver(at)web(dot)de>
 * @date 2019 November 7
 *
 * @section LICENSE
 *
 * Copyright 2019, Oliver Merkel <Merkel(dot)Oliver(at)web(dot)de>
 * All rights reserved.
 *
 * Released under the MIT license.
 *
 * @section DESCRIPTION
 *
 * @brief Class Hmi.
 *
 * Class representing the view or Hmi of TetrominoStacking.
 * TetrominoStacking is a solitaire tile stacking game.
 *
 */

const EMPTY = -1;
const EDGEBOTTOM = -2;
const EDGEWALL = -3;
const BLOCKSRC = 'fgkfgkfgkfgkfnoikmefngikiklbfniklbfnfnmeik' +
  'fgnikomnkeinfgifkofikfkniknfinefkgkninofim';
const colors = ['red', 'blue', 'green', 'cyan', 'orange', 'yellow', 'violet'];

function Hmi() {
  this.orientation = {
    down:  { angle:   0 },
    left:  { angle:  90 },
    up:    { angle: 180 },
    right: { angle: 270 }
  };
  this.panel = { x: 320, y: 460 };
  this.boardPos = { x: -10, y: -25 };
  this.gridSize = { x: 12, y: 24 };
  this.grid = [];
  this.timerID = null;
  this.paper = Raphael( 'board', this.panel.x, this.panel.y);
  this.paper.setViewBox(0, 0, this.panel.x, this.panel.y, false );
  this.resize();
  this.paper.rect( 0, 0, this.panel.x, this.panel.y ).attr({
    stroke: '#444', 'stroke-width': 0.2, 'stroke-linecap': 'round',
    fill: 'darkslategrey'
  });
  this.initTileQueue();
  for (var y=4; y<this.gridSize.y-1; ++y) {
    for (var x=1; x<this.gridSize.x-1; ++x) {
      this.paper.path(
        'M' + (x*20) + ',' + (y*20) + 'l20,0l0,20l-20,0l0,-20z'
      ).attr({ 'fill': 'none', 'stroke-width': 1 })
      .transform( 'T' + (this.boardPos.x) + ',' + this.boardPos.y )
    }
  }
  for (var y=0; y<this.gridSize.y; ++y) {
    this.grid[y] = [];
    for (var x=0; x<this.gridSize.x; ++x) {
      this.grid[y][x] = {
        color : this.gridSize.y-1==y ? EDGEBOTTOM : (
          0==x || this.gridSize.x-1==x ) ? EDGEWALL : EMPTY,
        path : this.paper.path(
          'M' + (x*20) + ',' + (y*20) + 'l20,0l0,20l-20,0l0,-20z'
        ).attr({
          'fill': 'red', 'stroke-width': 5, 'opacity': 0.0
        }).transform( 'T' + this.boardPos.x + ',' + this.boardPos.y )
      };
    }
  }
  var controlTranslate = { x: 0.8*this.panel.x, y: 0.8*this.panel.y };
  this.paper.circle(0,0,0.2*this.panel.x).attr({ fill: "#000", 'fill-opacity': 0.3,
    "stroke-width": this.panel.x*0.005, stroke: "black",
    opacity: 0.5 }).translate( controlTranslate.x, controlTranslate.y );
  this.controlRotate({x:-0.001*this.panel.x, y: 0.13*this.panel.x}, controlTranslate,
    false, 'black', this.rotateLeft );
  this.controlRotate({x:-0.001*this.panel.x, y: -0.13*this.panel.x}, controlTranslate,
    true, 'black', this.rotateRight );
  this.controlDirection({x:-0.134*this.panel.x, y: 0}, controlTranslate,
    this.orientation.left, 'black', this.moveLeft );
  this.controlDirection({x: 0.134*this.panel.x, y: 0}, controlTranslate,
    this.orientation.right, 'black', this.moveRight );

  this.controlDirection({x:0, y: -0.4*this.panel.x}, controlTranslate,
    this.orientation.down, 'black', this.letTileFall );
  this.controlPause({x:0.1*this.panel.x, y: -1.05*this.panel.x}, controlTranslate,
    'black', this.pauseGame );
}

Hmi.prototype.pauseGame = function() {
  this.isPaused = !this.isPaused;
};

Hmi.prototype.buildBlockPositions = function( type, orientation ) {
  var b = BLOCKSRC.substr( 12*type + 3*orientation, 3 );
  var result = [ { x: 1, y: 2 } ];
  for (var n=0; n<b.length; ++n) {
    var a = b.charCodeAt(n)-97;
    result[result.length] = { x: a%4, y: Math.floor(a/4) };
  }
  return result;
};

Hmi.prototype.initTileQueue = function() {
  this.tileQueue = {
    type: [ 0, 0, 0],
    pos: { x: 220, y: 20 },
    grid: []
  };
  for( var n=0; n<this.tileQueue.type.length; ++n ) {
    this.tileQueue.type[n] = Math.floor( Math.random() * 7 );
  }
  for( var n=0; n<this.tileQueue.type.length; ++n ) {
    this.tileQueue.grid[n] = [];
    for( var y=0; y<4; ++y ) {
      this.tileQueue.grid[n][y] = [];
      for( var x=0; x<4; ++x ) {
        this.tileQueue.grid[n][y][x] = {
          path : this.paper.rect(
            x*10 + this.tileQueue.pos.x,
            y*10 + this.tileQueue.pos.y + 50 * n, 10, 10
          ).attr({
            fill: 'red', 'stroke-width': 3, opacity: 0.0
          })
        };
      }
    }
  }
  this.paper.path('m225,72 10,-5 10,5').attr({ 'stroke-width': 3 });
  this.paper.path('m225,122 10,-5 10,5').attr({ 'stroke-width': 3 });
};

Hmi.prototype.updateTileQueue = function() {
  var multiColored = $('#multicolor').is(':checked');
  var mainColor = $('#maincolor').val();
  for( var n=0; n<this.tileQueue.type.length; ++n ) {
    for( var y=0; y<4; ++y ) {
      for( var x=0; x<4; ++x ) {
        this.tileQueue.grid[n][y][x].path.attr( 'opacity', 0.0 );
      }
    }
    var b = this.buildBlockPositions( this.tileQueue.type[n], 0 );
    for( var i=0; i<b.length; ++i ) {
      this.tileQueue.grid[n][b[i].y][b[i].x].path.attr({
        opacity: 1.0,
        fill: multiColored ? colors[this.tileQueue.type[n]] : mainColor
      });
    }
  }
};

Hmi.prototype.nextTileFromQueue = function() {
  var multiColored = $('#multicolor').is(':checked');
  var mainColor = $('#maincolor').val();
  this.fallingTile = {
    x: 4, y: 0,
    orientation: Math.floor(Math.random() * 4 ),
    type: this.tileQueue.type[0]
  };
  for( var n=0; n<this.tileQueue.type.length-1; ++n ) {
    this.tileQueue.type[n] = this.tileQueue.type[n+1];
  }
  this.tileQueue.type[this.tileQueue.type.length-1] = Math.floor( Math.random() * 7 );
  this.updateTileQueue();
  var b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
  for( var i=0; i<b.length; ++i ) {
    var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
    pos.path.attr({
      opacity: 1.0,
      fill: multiColored ? colors[this.fallingTile.type] : mainColor
    });
  }
};

Hmi.prototype.resize = function () {
  var offsetHeight = 64,
    availableWidth = window.innerWidth - 64,
    availableHeight = window.innerHeight - offsetHeight;
  this.size = availableWidth/availableHeight < this.panel.x/this.panel.y ?
    { x: availableWidth, y: availableWidth * this.panel.y/this.panel.x } :
    { x: availableHeight * this.panel.x/this.panel.y, y: availableHeight } ;
  this.paper.setSize( this.size.x, this.size.y );
  this.paper.setViewBox( 0, 0, this.panel.x, this.panel.y, false );
  var boardMarginTop = (availableHeight - this.size.y) / 2;
  $('#board').css({ 'margin-top': boardMarginTop + 'px' });
  $('#selectmenu').css({ 'margin-top': boardMarginTop + 'px' });
  $('#game-page').css({
    'background-size': 'auto ' + (this.size.x * 9 / 6) + 'px',
  });
  var size = (this.size.x + this.size.y) / 2 / 9;
  var minSize = 60;
  var iconSize = size < minSize ? minSize : size;
  var maxSize = 120;
  iconSize = maxSize < iconSize ? maxSize : iconSize;
  $('#customMenu').css({
    'width': iconSize+'px', 'height': iconSize+'px',
    'background-size': iconSize+'px ' + iconSize+'px',
  });
  var backAttributes = {
    'width': iconSize+'px', 'height': iconSize+'px',
    'background-size': iconSize+'px ' + iconSize+'px',
  };
  $('#customBackRules').css(backAttributes);
  $('#customBackOptions').css(backAttributes);
  $('#customBackAbout').css(backAttributes);
};

Hmi.prototype.clearGrid = function () {
  for(var y=this.gridSize.y-2; y>=0; --y) {
    for(x=1; x<this.gridSize.x-1; ++x) {
      this.grid[y][x].color = EMPTY;
      this.grid[y][x].path.attr('opacity', 0.0);
    }
  }
};

Hmi.prototype.initGame = function () {
  this.score = 0;
  this.nextTileFromQueue();
  this.updateChallenge();
  this.clearGrid();
  this.isPaused = false;
  $('#left-panel').panel('close');
};

Hmi.prototype.controlPause = function ( p, t, color, handler ) {
  var st = this.paper.set();
  st.push(
    this.paper.rect(p.x-8, p.y-11, 0.015*this.panel.x, 0.07*this.panel.x).attr({fill: "black",
      "stroke-width": this.panel.x*0.005, stroke: "black", opacity: 0.4 }),
    this.paper.rect(p.x+4, p.y-11, 0.015*this.panel.x, 0.07*this.panel.x).attr({fill: "black",
      "stroke-width": this.panel.x*0.005, stroke: "black", opacity: 0.4 }),
    this.paper.circle(p.x, p.y,0.075*this.panel.x).attr({fill: "black",
      "stroke-width": this.panel.x*0.005, stroke: "black",
      'fill-opacity': 0.21, 'stroke-opacity': 0.5})
  );
  st.attr({ cursor: 'pointer', });
  st.click( handler.bind(this) );
  st.translate( t.x, t.y );
  return st;
};

Hmi.prototype.controlDirection = function ( p, t, orientation, color, handler ) {
  var st = this.paper.set();
  st.push(
    this.paper.path('m ' + (0.04*this.panel.x) + ',0 ' +
      (-0.08*this.panel.x) + ',0 ' + 0.04*this.panel.x + ',' +
      (0.04*this.panel.x) + ' z').translate(p.x,p.y)
      .rotate( orientation.angle,t.x,t.y )
      .attr({fill: color, "stroke-width": this.panel.x*0.03,
      'stroke-linejoin': "round", stroke: color, opacity: 0.4 }),
    this.paper.circle(p.x, p.y,0.1*this.panel.x).attr({fill: "black",
      "stroke-width": this.panel.x*0.005, stroke: "black", opacity: 0.01 })
  );
  st.attr({ cursor: 'pointer', });
  st.click( handler.bind(this) );
  st.translate( t.x, t.y );
  return st;
};

Hmi.prototype.controlRotate = function ( p, t, clockwise, color, handler ) {
  var st = this.paper.set();
  st.push(
    this.paper.path('m-5,14a15 15 0 1 1 10 0').translate(p.x,p.y)
      .attr({"stroke-width": this.panel.x*0.01,
      'stroke-linejoin': "round", stroke: color, opacity: 0.4}).attr(
      (clockwise ? 'arrow-end':'arrow-start'), 'block-wide-long') ,
    this.paper.circle(p.x, p.y,0.1*this.panel.x).attr({fill: "black",
      "stroke-width": this.panel.x*0.005, stroke: "black", opacity: 0.01 })
  );
  st.attr({ cursor: 'pointer', });
  st.click( handler.bind(this) );
  st.translate( t.x, t.y );
  return st;
};

Hmi.prototype.init = function () {
  this.initGame();
  var $window = $(window);
  window.addEventListener("orientationchange", this.resize.bind( this ));
  $window.resize( this.resize.bind( this ) );
  $window.resize();
  this.updateChallenge();
  $('#restart').on( 'click', this.initGame.bind(this) );
  $('#customBackOptions').on( 'click', this.updateChallenge.bind(this) );
  $('#customOkOptions').on( 'click', this.updateChallenge.bind(this) );
};

Hmi.prototype.countEmpty = function ( y ) {
  var result = 0;
  for(x=1; x<this.gridSize.x-1; ++x) {
    result += this.grid[y][x].color == EMPTY ? 1 : 0;
  }
  return result;
};

Hmi.prototype.groomBoard = function () {
  var bonus = 1;
  for(var y=this.gridSize.y-2; y>4; --y) {
    while(this.countEmpty(y)==0) {
      for(var yc=y; yc>4; --yc) {
        for(x=1; x<this.gridSize.x-1; ++x) {
          var c = this.grid[yc-1][x].color;
          this.grid[yc][x].color = c;
          this.grid[yc][x].path.attr({
            opacity: c == EMPTY ? '0.0' : '1.0',
            fill: colors[c]
          });
        }
      }
      this.score += bonus;
      ++bonus;
      this.updateChallenge();
    }
  }
};

Hmi.prototype.letTileFall = function () {
  var multiColored = $('#multicolor').is(':checked');
  var mainColor = $('#maincolor').val();
  if (!this.isPaused) {
    var b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 0.0 });
    }
    var targetFree = true;
    for( var i=0; i<b.length && targetFree; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y+1][b[i].x+this.fallingTile.x];
      targetFree = EMPTY == pos.color;
    }
    if (targetFree) {
      ++this.fallingTile.y;
      for( var i=0; i<b.length; ++i ) {
        var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
        pos.path.attr({ opacity: 1.0, fill: multiColored ? colors[this.fallingTile.type] : mainColor });
      }
    } else {
      for( var i=0; i<b.length; ++i ) {
        var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
        pos.color = this.fallingTile.type;
        pos.path.attr({ opacity: 1.0, fill: multiColored ? colors[this.fallingTile.type] : mainColor });
      }
      this.groomBoard();
      if ( this.countEmpty(2) != this.gridSize.x-2 ) {
        clearInterval( this.timerID );
        this.timerID = null;
      } else {
        this.nextTileFromQueue();
      }
    }
  }
};

Hmi.prototype.rotateLeft = function () {
  var multiColored = $('#multicolor').is(':checked');
  var mainColor = $('#maincolor').val();
  if(!this.isPaused) {
    var b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 0.0 });
    }
    var oldOrientation = this.fallingTile.orientation;
    this.fallingTile.orientation = (this.fallingTile.orientation + 3) % 4;
    b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    var targetFree = true;
    for( var i=0; i<b.length && targetFree; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      targetFree = EMPTY == pos.color;
    }
    if (!targetFree) {
      this.fallingTile.orientation = oldOrientation;
      b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    }
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 1.0, fill: multiColored ? colors[this.fallingTile.type] : mainColor });
    }
  }
};

Hmi.prototype.rotateRight = function () {
  var multiColored = $('#multicolor').is(':checked');
  var mainColor = $('#maincolor').val();
  if(!this.isPaused) {
    var b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 0.0 });
    }
    var oldOrientation = this.fallingTile.orientation;
    this.fallingTile.orientation = (this.fallingTile.orientation + 1) % 4;
    var targetFree = true;
    b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    for( var i=0; i<b.length && targetFree; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      targetFree = EMPTY == pos.color;
    }
    if (!targetFree) {
      this.fallingTile.orientation = oldOrientation;
      b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    }
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 1.0, fill: multiColored ? colors[this.fallingTile.type] : mainColor });
    }
  }
};

Hmi.prototype.moveLeft = function () {
  var multiColored = $('#multicolor').is(':checked');
  var mainColor = $('#maincolor').val();
  if(!this.isPaused) {
    var b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 0.0 });
    }
    var targetFree = true;
    for( var i=0; i<b.length && targetFree; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x-1];
      targetFree = EMPTY == pos.color;
    }
    if (targetFree) {
      --this.fallingTile.x;
    }
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 1.0, fill: multiColored ? colors[this.fallingTile.type] : mainColor });
    }
  }
};

Hmi.prototype.moveRight = function () {
  var multiColored = $('#multicolor').is(':checked');
  var mainColor = $('#maincolor').val();
  if(!this.isPaused) {
    var b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 0.0 });
    }
    var targetFree = true;
    for( var i=0; i<b.length && targetFree; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x+1];
      targetFree = EMPTY == pos.color;
    }
    if (targetFree) {
      ++this.fallingTile.x;
    }
    for( var i=0; i<b.length; ++i ) {
      var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
      pos.path.attr({ opacity: 1.0, fill: multiColored ? colors[this.fallingTile.type] : mainColor });
    }
  }
};

Hmi.prototype.updateChallenge = function() {
  this.setHeader();
  var multiColored = $('#multicolor').is(':checked');
  var mainColor = $('#maincolor').val();
  var delay = Number($('#delay').val());
  if ( null != this.timerID ) {
    clearInterval( this.timerID );
    this.timerID = null;
  }
  this.timerID = setInterval( this.letTileFall.bind(this), delay);
  for( var n=0; n<this.tileQueue.type.length; ++n ) {
    for( var y=0; y<4; ++y ) {
      for( var x=0; x<4; ++x ) {
        this.tileQueue.grid[n][y][x].path.attr({
          fill: multiColored ? colors[this.tileQueue.type[n]] : mainColor
        });
      }
    }
  }
  for (var y=0; y<this.gridSize.y; ++y) {
    for (var x=0; x<this.gridSize.x; ++x) {
      var c = this.grid[y][x].color;
      if (c >= 0) {
        this.grid[y][x].path.attr({ fill: multiColored ? colors[c] : mainColor });
      }
    }
  }
  var b = this.buildBlockPositions( this.fallingTile.type, this.fallingTile.orientation );
  for( var i=0; i<b.length; ++i ) {
    var pos = this.grid[b[i].y+this.fallingTile.y][b[i].x+this.fallingTile.x];
    pos.path.attr({ fill: multiColored ? colors[this.fallingTile.type] : mainColor });
  }
};

Hmi.prototype.setHeader = function() {
  $('#myheader').html( "Tetromino Stacking - score: " + this.score );
};

var g_Hmi;
$(document).ready( function () {
  g_Hmi = new Hmi();
  g_Hmi.init();
});
