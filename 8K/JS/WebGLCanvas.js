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
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES
  LOSS OF USE, DATA, OR PROFITS OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
  ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

  TITLE
    H.268 8K VIDEO CODEC WebGLCanvas
  
  DESCRIPTION
    Render canvas pixel-data, using WebGL
    
    The human eye has fairly little spatial sensitivity to color: 
    the accuracy of the brightness information of the luminance channel 
    has far more impact on the image detail discerned. 

    All modern analogue and even most digital video standards use 
    [[chroma subsampling]] by recording a picture's color information 
    at reduced resolution. Only half the horizontal resolution compared 
    to the brightness information is kept (termed 4:2:2 chroma subsampling), 
    and often the vertical resolution is also halved (giving 4:2:0).  

    [ Y : U : V ] chroma subsampling...

    The 4:x:x standard was adopted due to the very earliest color NTSC standard 
    which used a chroma subsampling of 4:1:1 (where the horizontal color resolution 
    is quartered while the vertical is full resolution) so that the picture carried 
    only a quarter as much color resolution compared to brightness resolution. 
    Today, only high-end equipment processing uncompressed signals use 
    4:4:4 chroma subsampling with identical resolution for both brightness 
    and color information. (Ref. Wikipedia - YUV)
    
    RGB files are typically encoded in 8, 12, 16 or 24 bits per pixel. 
    In these examples, we will assume 24 bits per pixel, which is written as RGB 888. 
    The standard byte format is: 
    
    r0 = rgb[0]; g0 = rgb[1]; b0 = rgb[2]; 
    r1 = rgb[3]; g1 = rgb[4]; b1 = rgb[5];  
    
    Y'UV files can be encoded in 12, 16 or 24 bits per pixel. The common 
    formats are Y'UV444 (or YUV444), YUV411, YUV422, and YUV420 or YUV420p 
    (YUV420 planar => Y's U's V's grouped together to facilitate compression) 
    In terms of actual file formats, YUV420 is the most common, as the data 
    is more easily compressed, and the file extension is usually .YUV.
    The relation between data rate and sampling (A:B:C) is defined 
    by the ratio between Y to U and V channel
    
    ITU-T Rec. 601 NTSC
    
      YUV - (Y') Luminance and (UV) Chrominance:
      
        W_R = 0.299
        W_G = 1 - 0.299 - 0.114 
            = 0.587
        W_B = 0.114
        
        U_Max = 0.436
        V_Max = 0.615
        
        Y' = W_R R + W_G G + W_B B 
           = 0.299 R + 0.587 G + 0.114 B
        U  = U_Max {B - Y'}/{1 - W_B}
           = 0.492 (B - Y') 
        V  = V_Max {R - Y'}/{1 - W_R}
           = 0.877 (R - Y')
           
        Y' values are conventionally shifted and scaled to the range [16, 235] 
        (referred to as studio swing or TV levels) rather than using the full 
        range of [0, 255] (referred to as full swing or PC levels) This 
        practice derives from the MPEG standards and explains why 16 
        is added to Y' and why the Y' coefficients in the basic transform 
        sum to 220 instead of 255. (Ref. Wikipedia - YUV)
        
      YUV To RGB:
      
         R = Y' + V {1 - W_R}/{V_Max} 
           = Y' + 1.14 V
         G = Y' - U {W_B {1 - W_B}/{U_Max} W_G} - V {{W_R (1 - W_R)}/{V_Max W_G}} 
           = Y' - 0.395 U - 0.581 V
         B = Y' + U {1 - W_B}/{U_Max} 
           = Y' +  2.033 U

   ITU-T Rec. 709 ATSC
    
      YUV - (Y') Luminance and (UV) Chrominance:
   
        W_R = 0.2126
        W_G = 0.7252
        W_B = 0.0722 
    
  AUTHOR
    Seagat2011
  
  INPUT
    HTMLCanvas
    
  OUTPUT
    WebGLCanvas for ATSC/NTSC video
    
  VERSION
    Major.Minor.Bugfix.Patch
    1.0.0.0

*/

function WebGLCanvas(html_canvasElement){
  var self = this
  this.width = 1600
  this.height = 900
  this.croppingParams = {}
  this.type = "yuv420"
  this.contextGL = null
  this.canvasElement = html_canvasElement
  this.canvasElement.width = this.width
  this.canvasElement.height = this.height
  this.conversionType = "rec601"
  this.shaderProgram = null
  this.contextOptions = {
    preserveDrawingBuffer : true,
  }
  this.render_protocol = {
    yuv420 : function(par) {
      var gl = self.contextGL
      var texturePosBuffer = self.texturePosBuffer
      var uTexturePosBuffer = self.uTexturePosBuffer
      var vTexturePosBuffer = self.vTexturePosBuffer
      var yTextureRef = self.yTextureRef
      var uTextureRef = self.uTextureRef
      var vTextureRef = self.vTextureRef
      var height = this.height = par.height
      var width = this.width = par.width
      var ylen = (height * width)
      var uvlen = (width / 2) * (height / 2) // yuv420 //
      var yData = par.yData //|| par.img //par.img // new UInt8Array(self.img.slice(0,ylen))
      var uData = par.uData //|| new Uint8Array(par.img.slice(0,uvlen)) // new Uint8Array(self.img.slice(ylen,ylen+uvlen))
      var vData = par.vData //|| par.img //new Uint8Array(par.img.slice(uvlen,uvlen+uvlen)) // new Uint8Array(self.img.slice(ylen+uvlen,ylen+uvlen+uvlen))
      var yDataPerRow = par.yDataPerRow || width
      var yRowCnt     = par.yRowCnt || height
      var uDataPerRow = par.uDataPerRow || (width / 2)
      var uRowCnt     = par.uRowCnt || (height / 2)
      var vDataPerRow = par.vDataPerRow || uDataPerRow
      var vRowCnt     = par.vRowCnt || uRowCnt
      gl.viewport(0, 0, width, height)
      var tTop = 0
      var tLeft = 0
      var tBottom = height / yRowCnt
      var tRight = width / yDataPerRow
      var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom])
      gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW)
      if (self.customYUV444){
        tBottom = height / uRowCnt
        tRight = width / uDataPerRow
      }else{
        tBottom = (height / 2) / uRowCnt
        tRight = (width / 2) / uDataPerRow
      }
      var uTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom])
      gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, uTexturePosValues, gl.DYNAMIC_DRAW)
      if (self.customYUV444){
        tBottom = height / vRowCnt
        tRight = width / vDataPerRow
      }else{
        tBottom = (height / 2) / vRowCnt
        tRight = (width / 2) / vDataPerRow
      }
      var vTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom])
      gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, vTexturePosValues, gl.DYNAMIC_DRAW)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, yTextureRef)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, uTextureRef)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, uDataPerRow, uRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uData)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, vTextureRef)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, vDataPerRow, vRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, vData)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) 
      },
    yuv422 : function(par) {
      var gl = self.contextGL
      var texturePosBuffer = self.texturePosBuffer
      var textureRef = self.textureRef
      var data = par.img
      var height = this.height = par.height
      var width = this.width = par.width
      var dataPerRow = par.dataPerRow || (width * 2)
      var rowCnt     = par.rowCnt || height
      gl.viewport(0, 0, width, height)
      var tTop = 0
      var tLeft = 0
      var tBottom = height / rowCnt
      var tRight = width / (dataPerRow / 2)
      var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom])
      gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW)
      gl.uniform2f(gl.getUniformLocation(self.shaderProgram, 'resolution'), dataPerRow, height)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textureRef)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, dataPerRow, rowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) 
      },
  }// render protocol
  this.initContextGL = function() {
    var canvas = this.canvasElement
    var gl = null
    var validContextNames = ["experimental-webgl", "webgl","webkit-3d", "moz-webgl"]
    var nameIndex = 0
    while(!gl && nameIndex < validContextNames.length) {
      var contextName = validContextNames[nameIndex]
      try {
        if (this.contextOptions){
          gl = canvas.getContext(contextName, this.contextOptions)
        }else{
          gl = canvas.getContext(contextName)
        }
      } catch (e) {
        gl = null
      }
      if(!gl || typeof gl.getParameter !== "function") {
        gl = null
      }    
      ++nameIndex
    } // loop gl
    this.contextGL = gl
  }
  this.initProgram = function() {
    var gl = this.contextGL
    // vertex shader is the same for all types
    var vertexShaderScript
    var fragmentShaderScript
    if (this.type === "yuv420"){
      vertexShaderScript = [
        'attribute vec4 vertexPos;',
        'attribute vec4 texturePos;',
        'attribute vec4 uTexturePos;',
        'attribute vec4 vTexturePos;',
        'varying vec2 textureCoord;',
        'varying vec2 uTextureCoord;',
        'varying vec2 vTextureCoord;',
        'void main()',
        '{',
        '  gl_Position = vertexPos;',
        '  textureCoord = texturePos.xy;',
        '  uTextureCoord = uTexturePos.xy;',
        '  vTextureCoord = vTexturePos.xy;',
        '}',
      ].join('\n')
      fragmentShaderScript = [
        'precision highp float;',
        'varying highp vec2 textureCoord;',
        'varying highp vec2 uTextureCoord;',
        'varying highp vec2 vTextureCoord;',
        'uniform sampler2D ySampler;',
        'uniform sampler2D uSampler;',
        'uniform sampler2D vSampler;',
        'uniform mat4 YUV2RGB;',
        'void main(void) {',
        '  highp float y = texture2D(ySampler,  textureCoord).r;',
        '  highp float u = texture2D(uSampler,  uTextureCoord).r;',
        '  highp float v = texture2D(vSampler,  vTextureCoord).r;',
        '  gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;',
        '}',
      ].join('\n')
    }
    else 
    if (this.type === "yuv422"){
      vertexShaderScript = [
        'attribute vec4 vertexPos;',
        'attribute vec4 texturePos;',
        'varying vec2 textureCoord;',
        'void main()',
        '{',
        '  gl_Position = vertexPos;',
        '  textureCoord = texturePos.xy;',
        '}',
      ].join('\n')
      fragmentShaderScript = [
        'precision highp float;',
        'varying highp vec2 textureCoord;',
        'uniform sampler2D sampler;',
        'uniform highp vec2 resolution;',
        'uniform mat4 YUV2RGB;',
        'void main(void) {',
        '  highp float texPixX = 1.0 / resolution.x;',
        '  highp float logPixX = 2.0 / resolution.x;',      // half the resolution of the texture
        '  highp float logHalfPixX = 4.0 / resolution.x;',  // half of the logical resolution so every 4th pixel
        '  highp float steps = floor(textureCoord.x / logPixX);',
        '  highp float uvSteps = floor(textureCoord.x / logHalfPixX);',
        '  highp float y = texture2D(sampler, vec2((logPixX * steps) + texPixX, textureCoord.y)).r;',
        '  highp float u = texture2D(sampler, vec2((logHalfPixX * uvSteps), textureCoord.y)).r;',
        '  highp float v = texture2D(sampler, vec2((logHalfPixX * uvSteps) + texPixX + texPixX, textureCoord.y)).r;',
        //'  highp float y = texture2D(sampler,  textureCoord).r;',
        '  gl_FragColor = vec4(y, u, v, 1.0) * YUV2RGB;',
        '}',
      ].join('\n')
    }
    var YUV2RGB = []
    if (this.conversionType === "rec709") {
        // ITU-T Rec. 709 ATSC HDTV
        YUV2RGB = [
            1.16438,  0.00000,  1.79274, -0.97295,
            1.16438, -0.21325, -0.53291,  0.30148,
            1.16438,  2.11240,  0.00000, -1.13340,
            0, 0, 0, 1,
        ]
    } 
    else 
    if(this.conversionType === "rec601"){
        // ITU-T Rec. 601 NTSC SDTV
        YUV2RGB = [
            1.16438,  0.00000,  1.59603, -0.87079,
            1.16438, -0.39176, -0.81297,  0.52959,
            1.16438,  2.01723,  0.00000, -1.08139,
            0, 0, 0, 1
        ]
    }
    else
    if(this.conversionType === "rec2020"){
      // ITU-T Rec. 2020 UHDTV
      YUV2RGB = [
      
      ]
    }
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertexShaderScript)
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.log('Vertex shader failed to compile: ' + gl.getShaderInfoLog(vertexShader))
    }
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fragmentShaderScript)
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.log('Fragment shader failed to compile: ' + gl.getShaderInfoLog(fragmentShader))
    }
    var program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log('Program failed to compile: ' + gl.getProgramInfoLog(program))
    }
    gl.useProgram(program)
    var YUV2RGBRef = gl.getUniformLocation(program, 'YUV2RGB')
    gl.uniformMatrix4fv(YUV2RGBRef, false, YUV2RGB)
    this.shaderProgram = program
  } // initProgram
  this.initBuffers = function() {
    var gl = this.contextGL
    var program = this.shaderProgram
    var vertexPosBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW)
    var vertexPosRef = gl.getAttribLocation(program, 'vertexPos')
    gl.enableVertexAttribArray(vertexPosRef)
    gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0)
    if (this.animationTime){
      var animationTime = this.animationTime
      var timePassed = 0
      var stepTime = 15
      var aniFun = function(){
        timePassed += stepTime
        var mul = ( 1 * timePassed ) / animationTime
        if (timePassed >= animationTime){
          mul = 1
        }
        else{
          setTimeout(aniFun, stepTime)
        }
        var neg = -1 * mul
        var pos = 1 * mul
        var vertexPosBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([pos, pos, neg, pos, pos, neg, neg, neg]), gl.STATIC_DRAW)
        var vertexPosRef = gl.getAttribLocation(program, 'vertexPos')
        gl.enableVertexAttribArray(vertexPosRef)
        gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0)
        try{
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }catch(e){}
      }
      aniFun()
    }
    var texturePosBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW)
    var texturePosRef = gl.getAttribLocation(program, 'texturePos')
    gl.enableVertexAttribArray(texturePosRef)
    gl.vertexAttribPointer(texturePosRef, 2, gl.FLOAT, false, 0, 0)
    this.texturePosBuffer = texturePosBuffer
    if (this.type === "yuv420"){
      var uTexturePosBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW)
      var uTexturePosRef = gl.getAttribLocation(program, 'uTexturePos')
      gl.enableVertexAttribArray(uTexturePosRef)
      gl.vertexAttribPointer(uTexturePosRef, 2, gl.FLOAT, false, 0, 0)
      this.uTexturePosBuffer = uTexturePosBuffer
      var vTexturePosBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW)
      var vTexturePosRef = gl.getAttribLocation(program, 'vTexturePos')
      gl.enableVertexAttribArray(vTexturePosRef)
      gl.vertexAttribPointer(vTexturePosRef, 2, gl.FLOAT, false, 0, 0)
      this.vTexturePosBuffer = vTexturePosBuffer
    }
  }// initBuffers
  this.initTextures = function() {
    var gl = this.contextGL
    var program = this.shaderProgram
    if (this.type === "yuv420"){
      var yTextureRef = this.initTexture()
      var ySamplerRef = gl.getUniformLocation(program, 'ySampler')
      gl.uniform1i(ySamplerRef, 0)
      this.yTextureRef = yTextureRef
      var uTextureRef = this.initTexture()
      var uSamplerRef = gl.getUniformLocation(program, 'uSampler')
      gl.uniform1i(uSamplerRef, 1)
      this.uTextureRef = uTextureRef
      var vTextureRef = this.initTexture()
      var vSamplerRef = gl.getUniformLocation(program, 'vSampler')
      gl.uniform1i(vSamplerRef, 2)
      this.vTextureRef = vTextureRef
    }
    else 
    if (this.type === "yuv422"){
      // only one texture for 422
      var textureRef = this.initTexture()
      var samplerRef = gl.getUniformLocation(program, 'sampler')
      gl.uniform1i(samplerRef, 0)
      this.textureRef = textureRef
    }
  }
  this.initTexture = function() {
    var gl = this.contextGL
    var textureRef = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, textureRef)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindTexture(gl.TEXTURE_2D, null)
    return textureRef
  }
  this.drawNextFrameYUV = function(w){
    console.log("WebGLCanvas::drawFrameYUV")
    this.render_protocol[this.type](w) || Error("WebGLCanvas::drawFrameYUV:382 *** Error! *** webgl params: yuv420 or yuv422 ?? ") 
  }
  this.drawNextFrameRGBA = function(w){
    console.log("WebGLCanvas::drawFrameRGBA")
    var width = this.width = w.width 
    var height = this.hight = w.height 
    var img = w.img
    var canvas = this.canvasElement
    var croppingParams = this.croppingParams = w.croppingParams
    var ctx = canvas.getContext('2d')
    var imageData = ctx.getImageData(0, 0, width, height)
    imageData.data.set(img)
    if(croppingParams === null) {
      ctx.putImageData(imageData, 0, 0)
    } else {
      ctx.putImageData(imageData, -croppingParams.left, -croppingParams.top, 0, 0, croppingParams.width, croppingParams.height)
    }
  }  
  this.drawNextFrame = function(w){
    console.log("WebGLCanvas::drawFrame")
    if(this.contextGL) {
      this.drawNextFrameYUV(w)
    } else {
      this.drawNextFrameRGBA(w)
    }  
  }
  this.initContextGL()
  if(this.contextGL) {
    this.initProgram()
    this.initBuffers()
    this.initTextures()
  }
  console.log("WebGLCanvas::constructor()")
}