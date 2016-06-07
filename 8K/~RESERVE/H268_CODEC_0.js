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
  this.encode = function(e){
    console.log("H268_CODEC::encode()\nencoding...")
  }
  this.decode = function(e){
    console.log("H268_CODEC::decode()\ndecoding...")
    var bytes = e.bytes
    //var height = 1600 // TODO decode from stream
    //var width = 900   // TODO decode from stream
    var params = {
      //croppingParams : {},
      //height : height,
      //width : width,
      nextFrame : true,
      bytes : bytes,
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

/*
addEventListener("message",decode,"H268_DEMO.htm")

function decode(e){
  console.log("H268_CODEC::decode()")
  if(e.decode){
    console.log("decoding...")
    var bytes = e.bytes
    //var height = 1600 // TODO decode from stream
    //var width = 900   // TODO decode from stream
    var params = {
      //croppingParams : {},
      //height : height,
      //width : width,
      nextFrame : true,
      bytes : bytes,
    }
    postMessage(params)
  }
}
*/

addEventListener("message",g_H268_CODEC.callback,"H.268_DEMO.htm")
