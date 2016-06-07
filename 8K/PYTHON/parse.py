#!/usr/bin/python
import sys
import os
import re

fn = "Screenshot_2016-04-30_01-10-56.265.js"
reg = re.compile("\"\n\s+\"",re.I)

f00 = open(fn,"r")
f01 = open(fn+".00","w")

def strip(s):
  return "\\\n"
  
def isnewline(s):
    return reg.sub(strip,s)

f01.write(isnewline(f00.read()))

f00.close()
f01.close()