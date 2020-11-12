const Mode=require("./../constants");
const math=require("./../math");
class ShapeManager{
  constructor(renderer){
    this._renderer=renderer;
  }

  static create(ren){
    return new ShapeManager(ren);
  }

  static angleModer(ang, mod){
    return mod === Mode.DEGREES ? math.radians(ang) : ang;
  }
  static arcModer(cx, cy, mod){
    let fun=null;
    switch(mod){
      case Mode.CHORD: fun=function(ctx){
        ctx.closePath();
      };
      break;
      
      case Mode.PIE: fun=function(ctx){
        ctx.lineTo(cx, cy);
        ctx.closePath();
      };
      break;

      case Mode.OPEN:      
      default: fun=null;
    }
    return fun;
  }
  static ellipseModer(px, py, wid, hei, mod){
    let parArr=[];
    switch(mod){
      case Mode.CORNER: parArr=[px + wid, py + hei, wid, hei];
      break;
      case Mode.RADIUS: parArr=[px, py, wid * 2, hei * 2];
      break;
      case Mode.CORNERS:
        let x, y, w, h;
        if(wid - px < 0){
          w = px - wid;
          x = wid + w / 2;
        }else{
          w = wid - px;
          x = px + w / 2;
        }
        if(hei - py < 0){
          h = py - hei;
          y = hei + h/2;
        }else{
          h = hei - py;
          y = py + h/2;
        }
        parArr=[x, y, w, h];
      break;
      case Mode.CENTER:
      default: parArr=[px, py, wid, hei];
    }
    return parArr;
  }

  static rectModer(px, py, wid, hei, mod){
    let parArr=[];
    switch(mod){
      case Mode.CENTER: parArr=[px - (wid / 2), py - (hei / 2), wid, hei];
      break;
      case Mode.RADIUS: parArr=[px - wid, py - hei, wid * 2, hei * 2];
      break;
      case Mode.CORNERS:
        let x, y, w, h;
        if(wid - px < 0){
          w = px - wid;
          x = wid;
        }else{
          w = wid - px;
          x = px;
        }
        if(hei - py < 0){
          h = py - hei;
          y = hei;
        }else{
          h = hei - py;
          y = py;
        }
        parArr=[x, y, w, h];
      break;
      case Mode.CORNER:
      default: parArr=[px, py, wid, hei];
    }
    return parArr;
  }

  getCtx(){
    return this._renderer.context;
  }

  getState(){
    return this._renderer.state;
  }

  setRenderer(renderer){
    this._renderer=renderer;
    return this;
  }

  _drawShape(funs, tmpStateFn){
    const ctx=this.getCtx();
    const state=this.getState();
    ctx.beginPath();
    if(!!tmpStateFn){
      state.push();
      tmpStateFn(state, ctx);
    }
    state.applyState();
    funs(ctx);
    state.applyEffect();
    if(!!tmpStateFn) state.pop();
  }

  line(sx, sy, ex, ey){
    this._drawShape(ctx=>{
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
    });
  }

  ellipse(cx, cy, wid, hei){
    hei=hei || wid;

    [cx, cy, wid, hei]=ShapeManager.ellipseModer(cx, cy, wid, hei, this.getState()._ellipseMode);
    
    const radX=wid/2;
    const radY=hei/2;
    
    this._drawShape(ctx=>{
      ctx.ellipse(cx, cy, radX, radY, 0, 0, 44/7);
    });
  }

  circle(cx, cy, dia){
    this.ellipse(cx, cy, dia);
  }

  rect(px, py, wid, hei, tl, tr, br, bl){
    tl=tl || 0;
    tr=tr || tl;
    br=br || tl;
    bl=bl || tl;
    const min=(hei<wid?hei:wid)/2;
    tl=math.constrain(tl,0,min);
    tr=math.constrain(tr,0,min);
    br=math.constrain(br,0,min);
    bl=math.constrain(bl,0,min);

    [px,py,wid,hei]=ShapeManager.rectModer(px, py, wid, hei, this.getState()._rectMode);
    
    this._drawShape(ctx=>{
      ctx.moveTo(px + wid/2, py);
      ctx.arcTo(px + wid, py, px + wid, py + hei/2, tr);
      ctx.arcTo(px + wid, py + hei, px + wid/2, py + hei, br);
      ctx.arcTo(px, py + hei, px, py + hei/2, bl);
      ctx.arcTo(px, py, px + wid/2, py, tl);
      ctx.lineTo(px + wid/2, py);
    });
  }

  square(px, py, side, tl, tr, br, bl){
    this.rect(px, py, side, side, tl, tr, br, bl);
  }

  quad(x1, y1, x2, y2, x3, y3, x4, y4){
    this._drawShape(ctx=>{
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.lineTo(x3,y3);
      ctx.lineTo(x4,y4);
      ctx.closePath();
    });
  }

  point(px, py){
    function customStyler(state, ctx){
      if(state._willStroke) state.fill(ctx.strokeStyle);
      else state.noFill();
      state.noStroke();
    }

    this._drawShape(ctx=>{
      const rad=ctx.lineWidth/2;
      ctx.ellipse(px, py, rad, rad, 0, 0, 44/7);
    }, customStyler);
  }

  arc(cx, cy, w, h, st, end){
    const state=this.getState();
    [cx, cy, w, h]=ShapeManager.ellipseModer(cx, cy, w, h, state._ellipseMode);
    const arcModerFns=ShapeManager.arcModer(cx,cy,state._arcMode);

    st=ShapeManager.angleModer(st, state._angleMode);
    end=ShapeManager.angleModer(end, state._angleMode);
    
    this._drawShape(ctx=>{
      ctx.ellipse(cx, cy, w/2, h/2, 0, st, end);
      if(arcModerFns) arcModerFns(ctx);
    });
  }

  triangle(x1, y1, x2, y2, x3, y3){
    this._drawShape(ctx=>{
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
    });
  }
};

module.exports=ShapeManager;