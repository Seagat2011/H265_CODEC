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
    H.268 8K VIDEO CODEC
  
  DESCRIPTION
    Decode / Encodes a digital video stream from byte pixel data
    
  AUTHOR
    Seagat2011
  
  INPUT
    ByteStream
    
  OUTPUT
    H.268 video stream ( 1024 x 768 ) x 8
    
  VERSION
    Major.Minor.Bugfix.Patch
    1.0.0.0

*/


function H268_CODEC(){
  var self = this
  this.bytes = null
  this.height = 0
  this.width = 0
  this.encode = function(e){
    console.log("H268_CODEC::encode()\nencoding...")
  }
  this.prototype._rgba = function(w) {
    console.log("H268_CODEC::_rgba()")
    var y = w.y
    var u = w.u
    var v = w.v
    var yval
    var uval
    var vval
    var stridey = w.stridey
    var strideu = w.strideu
    var stridev = w.stridev
    var xpos = 0
    var ypos = 0
    var w2 = w.width >> 1
    var maxi = (w.width >> 1) * w.height
    var yoffset = 0
    var uoffset = 0
    var voffset = 0
    var x2
    var i2
    var i3
    var i4
    this.bytes = new Uint8Array(maxi).map(function(n,i,dest){
      i2 = i << 1
      i3 = i << 3
      i4 = ((i << 1) + 1) << 2
      x2 = (xpos << 1)
      yval = 1.164 * (y[yoffset + x2] - 16)
      uval = u[uoffset + xpos] - 128
      vval = v[voffset + xpos] - 128
      dest[i3+0] = yval + 1.596 * vval
      dest[i3+1] = yval - 0.813 * vval - 0.391 * uval
      dest[i3+2] = yval + 2.018 * uval
      dest[i3+3] = 0xff
      yval = 1.164 * (y[yoffset + x2 + 1] - 16)
      dest[i4+0] = yval + 1.596 * vval
      dest[i4+1] = yval - 0.813 * vval - 0.391 * uval
      dest[i4+2] = yval + 2.018 * uval
      dest[i4+3] = 0xff
      xpos++
      if (xpos === w2) {
          xpos = 0
          ypos++
          yoffset += stridey
          uoffset = ((ypos >> 1) * strideu)
          voffset = ((ypos >> 1) * stridev)
      }
    })
  }
  this._yuv420 = function(w){
    console.log("H268_CODEC::_yuv420()")
    return this.map(function(v,i,me){
      var ret = v
      if((i+1)%3){
        // NOP //
      }
      else{
        var _Y = 0.299 * (me[i-2] + 0.587 * me[i-1] + 0.114 * me[i]) // y
        var _U = 0.492 * (me[i] - /*_Y*/(0.299 * me[i-2] + 0.587 * me[i-1] + 0.114 * me[i])) // u
        var _V = 0.877 * (me[i-2] - /*_Y*/(0.299 * me[i-2] + 0.587 * me[i-1] + 0.114 * me[i])) // v
        me[i-2] = _Y
        me[i-1] = _U
        ret = _V // me[i] //
      }
      return ret
    })
  }
  this.decode = function(e){
    console.log("H268_CODEC::decode()\ndecoding...")
    var bytes = this.bytes = e.bytes
    var height = this.height = 1600 // TODO decode from stream
    var width = this.width = 900   // TODO decode from stream
    var params = {
      //croppingParams : {},
      //height : height,
      //width : width,
      nextFrame : true,
      bytes : self.bytes._yuv420(),
    }
    postMessage(params)
  }
  this.callback = function(e){
    console.log("H268_CODEC::callback")
    if(e.data.decode){
      self.decode(e.data)
    }
    else
    if(e.data.encode){
      self.encode(e.data)
    }
  }
  console.log("H268_CODEC::constructor()")
}

var g_H268_CODEC = new H268_CODEC()

addEventListener("message",g_H268_CODEC.callback,"H.268_DEMO.htm")
