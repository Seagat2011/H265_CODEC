/* 

  Copyright (c) 2016, Seagat2011
  All rights reserved.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to
  deal in the Software without restriction, including without limitation the
  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
  sell copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
  ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
  ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

  TITLE
    H.268 8K VIDEO IInterface
  
  DESCRIPTION
    Browser interface for H.268 CODEC
    
  AUTHOR
    Seagat2011
  
  INPUT
    new HTMLCanvasElement + *.268, *.mp4, *.264 video file
    
  OUTPUT
    video stream
    
  VERSION
    Major.Minor.Bugfix.Patch
    1.0.0.0

*/

/*
Uint8Array.prototype.subArray = function(start,end){
  var i = 0
  var obj = new this(end-start)
  return this.map(function(w,j){
    if((j>=start) && (j<end)){
      obj[i++] = w
      //obj.push(w)
    }
    return w
  })
}
*/

var g_frame = []
var g_start = 0
var g_end = 0
var g_byteLength = 0
var g_height = 1600
var g_width = 900
var g_Bpp = 3 // bytes per pixel
var g_stride = g_height * g_width * g_Bpp

//var g_h268_codec = new Worker("JS/CODEC/H268_CODEC.js")
//g_h268_codec.addEventListener("message",acceptNewFrame,"H.268_DEMO.htm")

//addEventListener("message",g_acceptNewFrame,"H268_DEMO.htm")

var g_acceptNewFrame = function(e){
  if(e.nextframe){
    g_frame.push(e.bytes)
    if((g_start+g_stride)<=g_byteLength){
      var params = {
        decode : true,
        bytes : e.bytes,
      }
      g_h268_codec.postMessage(params)
      //g_start += g_stride
    }
  } // test nextFrame
}

function IInterface_H268(w){
  var self = this
  //var height = 1600
  //var width = 900
  //var Bpp = 3 // 24 bits per pixel / 8 bits per byte
  this.webGLCanvas = new WebGLCanvas(w.canvas_element)
  this.byteStream = new ByteStream()
  this.h268_codec = new Worker("H268_CODEC.js")
  //this.h268_codec.addEventListener("message",g_acceptNewFrame,"H268_DEMO.htm")
  //this.h268_codec.addEventListener("message",this.acceptNewFrame,"H.268_DEMO.htm")
  this.status_window = w.status_window
  this.playBTN = w.playBTN
  //this.running = false
  this.isPaused = false
  //this.url = ""
  this.pos = 0
  this.start = 0
  this.end = 0
  this.byteLength = 0
  this.stride = 0
  this.frame = null
  this.play = function(file){
    console.log("IInterface_H268::play()")
    //if(file && (this.url != file.files[0].name)){
    if(file && (this.byteStream.url != file.files[0].name)){
      //this.url = file.files[0].name
      this.byteStream.openURL(
        file.files[0].name, // URI
        this.status_window, // status object
        function(){         // callback
          self.start = 0
          self.stride = g_stride // height * width * Bpp
          self.end = g_end = self.byteStream.getLength()
          self.byteLength = g_byteLength = self.byteStream.getLength()
          var params = {
            decode : true, 
            bytes : self.byteStream.getSubstream(self.start,self.stride)
          }
          //g_h268_codec.postMessage(params)
          self.h268_codec.postMessage(params)
          //this.h268_codec.postMessage(params)
          //this.start += this.stride
          self.isPaused = false
          self.updatePlayBTN()
        })
    }
    else{
      this.isPaused = !this.isPaused
      this.updatePlayBTN()
    }
  }
  this.updatePlayBTN = function(){
    this.playBTN.value = this.isPaused ? "Play" : "Pause"  
  }
  //this.h268_codec.onmessage = function(e){  
  this.acceptNewFrame = function(e){ // decoding loop..
    if(e.data.nextFrame){
      //self.frame.push(e.bytes)
      g_frame.push(e.data.bytes)
      if((self.start+self.stride)<=self.end){
        var params = {
          decode : true,
          bytes : self.byteStream.getSubstream(self.start,self.stride) // e.data.bytes, // self.byteStream.bytes.subArray(self.start,self.stride),
        }
        self.h268_codec.postMessage(params)
        //this.start += this.stride
      }
    }
  }
  this.h268_codec.addEventListener("message",this.acceptNewFrame,"H268_DEMO.htm")
  //this.h268_codec.addEventListener("message",g_acceptNewFrame,"H268_DEMO.htm")
  this.callback = function(v){
    var pos = self.pos
    //if(!self.isPaused && self.frame && (pos in self.frame)){
    if(!self.isPaused && g_frame && (pos in g_frame)){
      var params = {
        bytes : g_frame[pos],
        height : g_height,
        width : g_width,
      /*
        bytes : self.frame[pos],
        height : height,
        width : width,
      */
      }
      self.webGLCanvas.drawNextFrameRGBA( params )
      //self.pos++
    }
    //console.log("IInterface_H268::callback()")
  }
  //self.h268_codec.addEventListener("message",self.acceptNewFrame,"H.268_DEMO.htm")
  //addEventListener("message",this.acceptNewFrame,"H.268_DEMO.htm")
  setInterval(self.callback,15)
  console.log("IInterface_H268::constructor()")
}

//IInterface_H268.h268_codec.addEventListener("message",IInterface_H268.acceptNewFrame,"H.268_DEMO.htm")

