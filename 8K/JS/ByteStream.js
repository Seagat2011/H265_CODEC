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
    H.268 8K VIDEO CODEC bytestream
  
  DESCRIPTION
    Bytestream I/O
    
  AUTHOR
    Seagat2011
  
  INPUT
    *.268, *.mp4, *.264 video file
    
  OUTPUT
    raw video bytestream
    
  VERSION
    Major.Minor.Bugfix.Patch
    1.0.0.0

*/

/*
Uint8Array.prototype.subArray = function(start,end){
  var i = 0
  var obj = new Uint8Array(end-start)
  return this.map(function(w,j){
    if((j>=start) && (j<end)){
      obj[i++] = w
      //obj.push(w)
    }
    return w
  })
}
*/
            
function assert(cond,msg){
  if (!cond) {
    Error(message)
  }
}

function ByteStream(){
  this.stride = 3
  this.bytes = null // stored per frame //
  this.start = 0
  this.end = 0
  this.pos = 0
  this.streamLength = 0
  this.url = ""
  this._is64bitCompatible = window.navigator.oscpu.match(/64/) ? true : false
  this.openURL = function(uri,statusWindow,callback){
    console.log("ByteStream::openURL:",uri || this.url || "failed")
    if(uri){
      var async = true
      var putget = "GET"
      this.url = uri
      var xhr = new XMLHttpRequest()
      xhr.open(putget,uri,async)
      xhr.responseType = "arraybuffer"
      var self = this
      xhr.onreadystatechange = function(e){
        var banner = [
          function(){
            return "Processing file..." // 0 UNSENT
            }, 
          function(){
            return "Opening file..."    // 1 OPENED
            },
          function(){
            return "Initializing..."    // 2 HEADERS_RECEIVED
            },
          function(v){
            var status = {
              PUT:function(){
                return "Saving file..."
                },
              GET:function(){
                return "Loading file..."
                },
              default:function(w){
                var msg = {
                  PUT:"LOAD",
                  GET:"SAVE",
                  }
                return Error("Unable to complete "+msg[v]+" file operation.")
                },
            }
            return status[v]() || status['default'](v)    // 3 LOADING
            },
          function(){ 
            self.streamLength = self.end = e.target.response.byteLength
            self.bytes = new Uint8Array( e.target.response )
            if(callback){
              callback()
            }
            return "Ready"  // 4 DONE
            },              
        ]
        statusWindow.innerHTML = banner [ xhr.readyState ] (putget) || Error("Error parsing bitstream - Please try again.")
      } // onreadystatechange
      xhr.send()
    } // test(uri)
  }
  this.getStride = function(){
    console.log("ByteStream::getStride")
    return this.stride
  }
  this.setStride = function(w){
    console.log("ByteStream::setStride")
    var ret = false
    if(w){
      ret = true
      this.stride = w
    }
    return ret
  }
  this.readNBytes = function(i){
    console.log("ByteStream::readNBytes",self.pos,"upto",self.pos+self.stride)
    var n = 32-i
    var ret = this.readNBytesUnsigned(i) << n >> n
    this.pos += i
    return ret
  }
  this.readNBytesUnsigned = function(i){
    console.log("ByteStream::readNBytesUnsigned",self.pos,"upto",self.pos+i)
    var ret = 0
    if(this.pos >= this.end - i){
      ret = null
    }
    else{
      var self = this
      var arr = new Array(i)
      arr.map(function(w,j){
        ret |= self.bytes[j] << (32 - ( (j+1) * 8 ))
      })
    }
    return ret
  }
  this.peekNBytes = function(i,advance){
    console.log("ByteStream::peekNBytes",i || "failed")
    var ret = this.readNBytesUnsigned(i)
    if(advance){
      this.pos += i
    }
  }
  this.readNBytes64 = function(i){
    console.log("ByteStream::readNBytes",self.pos,"upto",self.pos+self.stride)
    var n = 64-i
    var ret = this.readNBytesUnsigned64(i) | 0
    this.pos += i
    return ret
  }
  this.readNBytesUnsigned64 = function(i){
    console.log("ByteStream::readNBytesUnsigned",self.pos,"upto",self.pos+i)
    var ret = 0
    if(this.pos >= this.end - i){
      ret = null
    }
    else{
      var self = this
      var arr = new Array(i)
      arr.map(function(w,j){
        ret |= self.bytes[j] << (64 - ( (j+1) * 8 ))
      })
    }
    return ret
  }
  this.peekNBytes64 = function(i,advance){
    console.log("ByteStream::peekNBytes",i || "failed")
    var ret = this.readNBytesUnsigned64(i)
    if(advance){
      this.pos += i
    }
  }
  this.seek = function(i){
    console.log("ByteStream::seek",i || "failed")
    if(i){
      this.pos = i
    }
  }
  this.skip = function(i){
    console.log("ByteStream::skip",i || "failed")
  
  }
  this.getLength = function(){
    console.log("ByteStream::getLength",self.streamLength || "failed")
    return this.streamLength //- this.start
  }
  this.getPosition = function(){
    console.log("ByteStream::getPosition",self.pos || "failed")
    return this.pos
  }
  this.getRemaining = function(){
    console.log("ByteStream::getRemaining",self.pos || "failed")
    return (this.streamLength - this.pos)
  }
  this.getSubstream = function(start, length){
    console.log("ByteStream::getSubstream",start,"upto",length)
    return new Uint8Array(this.bytes.slice(start,length)) // ByteStream({bytes:this.bytes.buffer.splice(start,length), start:start, streamLength:length});
  }
  this.isReserved = function (length, value){
    console.log("ByteStream::isReserved")
    for (var i = 0; i < length; i++) {
      assert (this.readNBytes(1) == value,"*** Error *** reserved sector file location: "+i)
    }
  }
  console.log("ByteStream::constructor()")
  if(!this._is64bitCompatible){
    console.log("os platform cpu greater than 64-bit: unverified")
  }
}



