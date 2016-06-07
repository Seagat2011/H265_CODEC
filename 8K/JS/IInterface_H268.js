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

var g_height = 1600
var g_width = 900
var g_Bpp = 3 // bytes per pixel
var g_stride = g_height * g_width * g_Bpp

function IInterface_H268(w){
  var self = this
  this.webGLCanvas = new WebGLCanvas(w.canvas_element)
  this.byteStream = new ByteStream()
  this.h268_codec = new Worker("JS/CODEC/H268_CODEC.js")
  this.status_window = w.status_window
  this.fps_window = w.fps_window
  this.playBTN = w.playBTN
  this.isPaused = false
  this.height = g_height
  this.width = g_width
  this.pos = 0
  this.start = 0
  this.end = 0
  this.byteLength = 0
  this.stride = 0
  this.frame = []
  this.play = function(file){
    console.log("IInterface_H268::play()")
    if(file && (this.byteStream.url != file.files[0].name)){
      this.byteStream.openURL(
        file.files[0].name, // URI
        this.status_window, // status object
        function(){         // callback
          self.start = 0
          self.stride = g_stride
          self.end = self.byteStream.getLength()
          self.byteLength = self.byteStream.getLength()
          var params = {
            decode : true, 
            bytes : self.byteStream.getSubstream(self.start,self.stride)
          }
          self.h268_codec.postMessage( params )
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
  this.acceptNewFrame = function(e){ // ...decode loop.. //
    console.log("IInterface_H268::acceptNewFrame()",self.frame.length)
    if(e.data.nextFrame){
      self.frame.push(e.data.bytes)
      if((self.start+self.stride)<=self.end){
        var params = {
          decode : true,
          bytes : self.byteStream.getSubstream(self.start,self.stride)
        }
        self.h268_codec.postMessage(params)
        //this.start += this.stride
      }
    }
  }
  this.h268_codec.addEventListener("message",this.acceptNewFrame,"H268_DEMO.htm")
  this.callback = function(v){
    var pos = self.pos
    if(!self.isPaused && self.frame && (pos in self.frame)){
      var params = {
        img : self.frame[pos],
        height : self.height,
        width : self.width,
      }
      self.webGLCanvas.drawNextFrame( params )
      //self.pos++      
    }
    //console.log("IInterface_H268::callback()")
  }
  setInterval(self.callback,1)
  console.log("IInterface_H268::constructor()")
}

