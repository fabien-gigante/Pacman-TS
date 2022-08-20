interface Number {
  in(a: number, b: number): boolean;
}
Number.prototype.in = function (this: number, a: number, b: number): boolean { return a <= this && this <= b; }

interface Object {
  map<T, V>(this: T, λ: (x: V) => V): {[P in keyof T]: V};
}
Object.prototype.map = function <V>(λ: (x: V) => V): any { return Object.keys(this).reduce((p, k) => ({ ...p, [k]: λ(this[k]) }), {}); };

interface Array<T> {
  includes(x: T): boolean;
  sortBy(λ: (x: T) => number): Array<T>;
  count(λ: (x: T) => boolean): number;
}
Array.prototype.includes = Array.prototype.includes || function <T>(this: Array<T>, x: T): boolean { return this.indexOf(x) >= 0; };
Array.prototype.sortBy = function <T>(this: Array<T>, λ: (x: T) => number): Array<T> { return this.sort((a, b) => λ(a) - λ(b)); };
Array.prototype.count = function <T>(this: Array<T>, λ: (x: T) => boolean): number { return this.reduce((c, x) => c + +λ(x), 0); };

interface StringMap<T> {
  [key: string]: T;
}

interface Window {
  debug?: boolean;
}

interface CanvasRenderingContext2D {
  resetTransform(): void;
  circle(x: number, y: number, radius: number): void;
  fillCircle(x: number, y: number, radius: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
}
type Canvas = CanvasRenderingContext2D;
CanvasRenderingContext2D.prototype.resetTransform = function (this: Canvas): void { this.setTransform(1, 0, 0, 1, 0, 0); };
CanvasRenderingContext2D.prototype.circle = function (this: Canvas, x, y, radius): void { this.arc(x, y, radius, 0, 2 * Math.PI); };
CanvasRenderingContext2D.prototype.fillCircle = function (this: Canvas, x, y, radius): void { this.beginPath(); this.circle(x, y, radius); this.fill(); };
CanvasRenderingContext2D.prototype.line = function (this: Canvas, x1, y1, x2, y2): void { this.moveTo(x1, y1); this.lineTo(x2, y2); };

namespace Pacman {

  interface Vector { x: number; y: number; }
  interface Point extends Vector { }
  interface Size { w: number; h: number; }
  interface Rectangle extends Point, Size { }

  class EventDispatcher {
    protected listeners: StringMap<Array<(e: EventDispatcher, ...x: any[]) => void>> = {};
    constructor() { }
    public addEventListener(event: string, λ: (e: EventDispatcher, ...x: any[]) => void): void {
      if (!(event in this.listeners)) this.listeners[event] = [];
      this.listeners[event].push(λ);
    }
    protected dispatchEvent(event: string, ...x: any[]): void {
      if (this.listeners[event] !== undefined)
        for (const λ of this.listeners[event]) λ(this, ...x);
    }
  }

  abstract class Shape extends EventDispatcher {
    constructor(public readonly canvas: Canvas, protected readonly w: number, protected readonly h: number) { super(); }
    public get size(): Size { return { w: this.w, h: this.h }; }
    public get radius(): number { return Shape.distance({ x: this.w / 2, y: this.h / 2 }); }
    public abstract get bounds(): Rectangle;
    public abstract paint(): void;
    public tick(): void { }
    public static gray(t: number): string { return `rgb(${t},${t},${t})`; }
    public static distance({ x, y }: Point, p?: Point): number {
      if (p === undefined) return Math.sqrt(x * x + y * y);
      else return Shape.distance({ x: x - p.x, y: y - p.y });
    }
  }

  abstract class Scene extends Shape {
    protected dirty: Array<Rectangle>;
    public get bounds(): Rectangle { return { x: 0, y: 0, ...this.size }; }
    public clear(rect?: Rectangle) {
      if (rect === undefined) this.dirty = [this.bounds];
      else this.dirty.push(rect);
    }
    public load(): void { this.clear(); }
    public paint(): void { this.dirty = []; }
    public wrap(pos: Point) {
      if (pos.x < 0) pos.x += this.w; else if (pos.x >= this.w) pos.x -= this.w;
      if (pos.y < 0) pos.y += this.h; else if (pos.y >= this.h) pos.y -= this.h;
    }
  }

  abstract class Board<T extends number> extends Scene {
    protected tiles: Array<Uint8Array>;
    public load(source?: (i: number, j: number) => T): void {
      if (source === undefined) throw new Error('Invalid Argument');
      super.load();
      this.tiles = Array<Uint8Array>(this.h);
      for (let j = 0; j < this.h; j++) {
        this.tiles[j] = new Uint8Array(this.w);
        for (let i = 0; i < this.w; i++) this.tiles[j][i] = source(i, j);
      }
    }
    private static getTileCenter(i: number, j: number): Point { return { x: i + 0.5, y: j + 0.5 }; }
    private static getTileBounds(i: number, j: number): Rectangle { return { x: i, y: j, w: 1, h: 1 }; }
    public getTile(i: number, j: number): T | undefined {
      return i.in(0, this.w - 1) && j.in(0, this.h - 1) ? <T>this.tiles[j][i] : undefined;
    }
    public setTile(i: number, j: number, tile: T) {
      if (this.tiles[j][i] == tile) return;
      this.tiles[j][i] = tile;
      this.clear(Board.getTileBounds(i, j));
    }
    public countTiles(a: Array<T>): number {
      let count: number = 0;
      if (this.tiles === undefined) return count;
      for (let j = 0; j < this.h; j++)
        for (let i = 0; i < this.w; i++)
          if (a.includes(<T>this.tiles[j][i])) count++;
      return count;
    }
    protected isAnimated(tile: T): boolean { return false; }
    protected isDirty({ x, y }: Point, tile: T): boolean {
      return this.isAnimated(tile) ||
        this.dirty.some((r: Rectangle) => r.x - 0.5 <= x && x < r.x + r.w + 1 && r.y - 0.5 <= y && y < r.y + r.h + 1);
    }
    protected getOrientation(tile: T): number { return 0; }
    private paintTile(i: number, j: number): void {
      const p: Point = Board.getTileCenter(i, j);
      const tile: T | undefined = this.getTile(i, j);
      if (tile === undefined || !this.isDirty(p, tile)) return;
      this.canvas.save();
      this.canvas.translate(p.x, p.y);
      this.canvas.rotate(this.getOrientation(tile) * Math.PI / 2);
      this.drawTile(tile);
      this.canvas.restore();
    }
    protected abstract drawTile(tile: T): void;
    protected clearTile(fillColor?: string): void {
      if (fillColor === undefined) return;
      this.canvas.fillStyle = fillColor;
      this.canvas.fillRect(-0.5, -0.5, 1, 1);
    }
    public static getFont(size: number = 1.1, bold: boolean = true): string { return (bold ? 'bold ' : '') + size + 'px Verdana, sans-serif'; }
    protected fillText(char: string, style?: string, size: number = 1.1): void {
      if (style === undefined) return;
      this.canvas.fillStyle = style;
      this.canvas.font = Board.getFont(size);
      this.canvas.textAlign = 'center';
      this.canvas.textBaseline = 'alphabetic';
      this.canvas.fillText(char, 0, 0.35);
    }
    public paint(): void {
      for (let j = 0; j < this.h; j++)
        for (let i = 0; i < this.w; i++)
          this.paintTile(i, j);
      super.paint();
    }
  }

  enum Tile { Empty, Dot, Energizer, Solid, Wall = 4, Angle = 8, Corner = 12, Door = 16, Fruit = 20, Life = 31, Text = 32 }

  class Maze extends Board<Tile> {
    public static readonly HEIGHT: number = 33;
    public static readonly WIDTH: number = 28;
    private static readonly BASE64_MAP: string = 'AAAAAAAAAAAAAAAAAAD1VVVVVVVVVVVVVVVVXmEREREREREREREREREUYbd3d3d6G6G3d3d3ehRhhVVe9VkUYYVe9VVZFGERERRhERRhERRhEREUx6G6FGG3fcd6FGG6G331kUYYkYVVVVkYkUYYXmIRRhERERABERERRhEkYbfWG3d6G6G3d6FMehRhhVkYVVkUYYVVkYVZFGERERERERRhEREREREUx3d6G6C3fcd6C6G3d30zMzYUYIVVVVkEYUMzMzMzNhRgAAAAAARhQzMzMzM2FGC3d3d6BGFDMzNVVVkYkE9VVeYIkYVVVQAAABAARgAARgABAAAAd3d6G6BMd3fWC6G3d3czMzYUYIVVVVkEYUMzMzMzNhRgAAAAAARhQzMzMzM2FMd6C6C3fWFDMzP1VVkU9VkEYIVeYYVVXmERERRhERRhERRhEREUYbd6FGG3fcd6FGG3ehRhhVkYkYVVVVkYkYVZFGEREREREREREREREREUYbd6G3d6G6G3d6G3ehRiQzYUMzYUYUMzYUM2JGGFWRhVWRRhhVWRhVkUYRERERERFGERERERERTHd3d3d3d9x3d3d3d3fQAAAAAAAAAAAAAAAAAA';
    private static readonly BG_FILLS: StringMap<string> = { Empty: 'black', Dot: 'black', Energizer: 'black', Solid: 'darkblue', Wall: 'black', Angle: 'black', Corner: 'darkblue', Door: 'black', Fruit:'black', Life: 'black', Text: 'black' };
    private static readonly FG_FILLS: StringMap<string> = { Dot: 'white', Energizer: 'white', Wall: 'darkblue', Angle: 'darkblue', Corner: 'black', Door: '#23415a', Fruit: 'lime', Life: 'yellow', Text: 'white' };
    private static readonly FG_STROKES: StringMap<string> = { Wall: 'blue', Angle: 'blue', Corner: 'blue', Door: 'steelblue' };
    private static readonly SIZES: StringMap<number> = { Wall: 1 / 6, Dot: 1 / 8, Energizer: 2 / 5, Life: 7 / 16 };
    public static readonly PEN_CENTER: Point = { x: Maze.WIDTH / 2, y: Maze.HEIGHT / 2 - 1 };
    private static readonly GLOW_FRAMES: number = 40;
    private frame: number = 0;
    private dots: number = 0;
    private totalDots: number = 0;

    constructor(canvas: Canvas) { super(canvas, Maze.WIDTH, Maze.HEIGHT); }
    public load(): void {
      const hex: string = window.atob(Maze.BASE64_MAP).split('').map(function (c) { return ('0' + c.charCodeAt(0).toString(16)).slice(-2); }).join('');
      super.load((i, j) => '0123456789abcdef'.indexOf(hex[(Maze.HEIGHT - 1 - j) * Maze.WIDTH + i]));
      for (let y: number = Maze.PEN_CENTER.y - 2.5; y <= Maze.PEN_CENTER.y - 1.5; y++)
        for (let x: number = Maze.PEN_CENTER.x - 1; x <= Maze.PEN_CENTER.x; x++)
          this.tiles[y][x] += Tile.Door - Tile.Wall;
      this.totalDots = this.dots = this.countTiles([Tile.Dot, Tile.Energizer]);
    }
    public getTile(i: number, j: number): Tile { return <Tile>super.getTile((i + this.w) % this.w, (j + this.h) % this.h); }
    public clearDot(i: number, j: number): Tile | undefined {
      const tile: Tile = this.getTile(i, j);
      if (tile != Tile.Dot && tile != Tile.Energizer) return undefined;
      this.setTile(i, j, Tile.Empty); this.dots--;
      if (this.dots == 0) this.dispatchEvent('cleared', true);
      else if (this.dots == Math.floor(this.totalDots / 3) || this.dots == Math.floor(2 * this.totalDots / 3)) this.dispatchEvent('cleared', false);
      return tile;
    }
    protected isAnimated(tile: Tile): boolean { return tile == Tile.Energizer; }
    private getBaseTile(tile: Tile): Tile {
      if (tile >= Tile.Text) return Tile.Text;
      if (tile.in(Tile.Fruit, Tile.Fruit + 9)) return Tile.Fruit;
      const base: Tile = tile - (tile % 4);
      return [Tile.Wall, Tile.Angle, Tile.Corner, Tile.Door].includes(base) ? base : tile;
    }
    protected getOrientation(tile: Tile): number {
      const base: Tile = this.getBaseTile(tile);
      return [Tile.Wall, Tile.Angle, Tile.Corner, Tile.Door].includes(base) ? tile % 4 : 0;
    }
    private fillTile(tile: Tile, style?: string): void {
      if (style === undefined) return;
      this.canvas.fillStyle = style;
      this.canvas.beginPath();
      if (tile == Tile.Dot)
        this.canvas.circle(0, 0, Maze.SIZES.Dot);
      else if (tile == Tile.Energizer)
        this.canvas.circle(0, 0, Maze.SIZES.Energizer);
      else if (tile == Tile.Wall || tile == Tile.Door)
        this.canvas.rect(0, -0.5, 0.5, 1);
      else if (tile == Tile.Angle || tile == Tile.Corner) {
        this.canvas.arc(0.5, 0.5, 0.5, -Math.PI, -Math.PI / 2);
        this.canvas.lineTo(0.5, 0.5);
      }
      else if (tile == Tile.Life) {
        this.canvas.moveTo(0, 0);
        this.canvas.arc(0, 0, Maze.SIZES.Life, Math.PI / 4, -Math.PI / 4);
      }
      this.canvas.fill();
    }
    private strokeTile(tile: Tile, style?: string): void {
      if (style === undefined) return;
      this.canvas.strokeStyle = style;
      this.canvas.lineWidth = Maze.SIZES.Wall;
      this.canvas.beginPath();
      if (tile == Tile.Wall || tile == Tile.Door)
        this.canvas.line(0, -0.5, 0, 0.5);
      else if (tile == Tile.Angle || tile == Tile.Corner)
        this.canvas.arc(0.5, 0.5, 0.5, -Math.PI, -Math.PI / 2);
      this.canvas.stroke();
    }
    protected drawTile(tile: Tile): void {
      const base: Tile = this.getBaseTile(tile);
      this.clearTile(Maze.BG_FILLS[Tile[base]]);
      let fgFill: string = Maze.FG_FILLS[Tile[base]];
      if (base == Tile.Energizer)
        fgFill = Shape.gray(155 + Math.round(100 * Math.sin(this.frame * 2 * Math.PI / Maze.GLOW_FRAMES)));
      if (base == Tile.Fruit) this.fillText(Fruit.ICONS[tile - Tile.Fruit], fgFill, 0.9);
      else if (base == Tile.Text) this.fillText(String.fromCharCode(tile), fgFill);
      else this.fillTile(base, fgFill);
      this.strokeTile(base, Maze.FG_STROKES[Tile[base]]);
    }
    public isFreeTile(i: number, j: number): boolean { return this.getTile(i, j) < Tile.Solid; }
    public isInPen({ x, y }: Point): boolean {
      return x.in(Maze.PEN_CENTER.x - 2, Maze.PEN_CENTER.x + 2) && y.in(Maze.PEN_CENTER.y - 0.5, Maze.PEN_CENTER.y + 0.5);
    }
    public isWalkable(p: Point, dir?: Vector, state?: State): boolean {
      const Ԑ: number = 1 / 16;
      // Through pen door...
      if (state !== undefined && dir !== undefined && dir.x == 0 && dir.y == (state == State.Dead ? 1 : -1) &&
        p.y >= Maze.PEN_CENTER.y - 3 - Ԑ && p.y <= Maze.PEN_CENTER.y + Ԑ && p.x >= Maze.PEN_CENTER.x - Ԑ && p.x <= Maze.PEN_CENTER.x + Ԑ) return true;
      // Surrounding tiles...
      const { x: i, y: j } = p.map(Math.floor);
      if (!this.isFreeTile(i, j)) return false;
      const up = this.isFreeTile(i, j - 1), down = this.isFreeTile(i, j + 1);
      const left = this.isFreeTile(i - 1, j), right = this.isFreeTile(i + 1, j);
      const x = p.x - i, y = p.y - j;
      // On middle strip ?
      if (left && x <= 0.5 + Ԑ && y.in(0.5 - Ԑ, 0.5 + Ԑ)) return true;
      if (right && x >= 0.5 - Ԑ && y.in(0.5 - Ԑ, 0.5 + Ԑ)) return true;
      if (up && y <= 0.5 + Ԑ && x.in(0.5 - Ԑ, 0.5 + Ԑ)) return true;
      if (down && y >= 0.5 - Ԑ && x.in(0.5 - Ԑ, 0.5 + Ԑ)) return true;
      if (dir === undefined) return false;
      // Can cut corners ?
      if (left && up && dir.x == -dir.y && x <= 0.5 && y <= 0.5 && y + x >= 0.5) return true;
      if (right && up && dir.x == dir.y && x >= 0.5 && y <= 0.5 && y - x >= -0.5) return true;
      if (left && down && dir.x == dir.y && x <= 0.5 && y >= 0.5 && - y + x >= -0.5) return true;
      if (right && down && dir.x == -dir.y && x >= 0.5 && y >= 0.5 && - y - x >= -1.5) return true;
      return false;
    }
    public tick(): void {
      this.frame = (this.frame + 1) % Maze.GLOW_FRAMES;
    }
    public setLifes(n: number): void {
      for (let i: number = 0; i < Game.MAX_LIFES; i++)
        this.setTile(i, Maze.HEIGHT - 1, i < n ? Tile.Life : Tile.Empty);
    }
    public setFruit(fruit: number): void {
      this.setTile(Maze.WIDTH - 1, Maze.HEIGHT - 1, Tile.Fruit + fruit % 10);
    }
    public setStatus(left: string, right?: string): void {
      for (let i: number = 0; i < Maze.WIDTH; i++) {
        let value: Tile = Tile.Empty;
        if (i < left.length) value = left.charCodeAt(i);
        if (right !== undefined && i >= Maze.WIDTH - right.length)
          value = right.charCodeAt(i - Maze.WIDTH + right.length);
        this.setTile(i, 0, value);
      }
    }
  }

  abstract class Sprite extends Shape {
    protected frame: number = 0;
    protected angle: number = 0;
    protected rotate: boolean = true;

    constructor(protected readonly scene: Scene, protected x: number, protected y: number, protected speed: number, w: number, h: number = w) {
      super(scene.canvas, w, h);
    }
    public get position(): Point { return { x: this.x, y: this.y }; }
    public get bounds(): Rectangle { return { x: this.x - this.w / 2, y: this.y - this.h / 2, ...this.size }; }
    public distance(sprite: Sprite): number { return Shape.distance(sprite.position, this.position); }
    protected checkHit(sprite: Sprite): boolean { return this.distance(sprite) <= this.radius + sprite.radius; }
    protected get hitTargets(): Array<Sprite> { return []; }
    protected checkHits(): void {
      for (const sprite of this.hitTargets)
        if (this.checkHit(sprite)) this.dispatchEvent('hit', sprite);
    }
    protected orientation(dir?: Vector | number): number {
      if (dir === undefined) return this.angle;
      if (typeof dir === 'number') return dir;
      return (dir.y != 0 || dir.x != 0) ? Math.atan2(dir.y, dir.x) : this.angle;
    }
    protected nextPosition(dir?: Vector | number): Point {
      const angle = this.orientation(dir);
      const pos: Point = { x: this.x + this.speed * Math.cos(angle), y: this.y + this.speed * Math.sin(angle) };
      this.scene.wrap(pos);
      return pos;
    }
    protected move(): void {
      ({ x: this.x, y: this.y } = this.nextPosition());
    }
    public paint(): void {
      this.scene.clear(this.bounds);
      this.canvas.save();
      this.canvas.translate(this.x, this.y);
      if (this.rotate) this.canvas.rotate(this.angle);
      this.draw();
      this.canvas.restore();
    }
    public abstract draw(): void;
    public tick(): void {
      super.tick();
      this.checkHits();
    }
  }
  
  class Fruit extends Sprite {
    public static readonly ICONS: string[] = '🍒 🍓 🍊 🍎 🍉 🍐 🍌 🍈 🍍 🍇'.split(' ');
    private static readonly SCORES: number[] = [100, 300, 500, 700, 1000, 2000, 3000, 5000, 7000, 10000];
    private static readonly MAX_FRAMES: number = 10 * 50;
    private readonly fruit: number;
    constructor(scene: Scene, protected consumer: Actor, fruit: number) {
      super(scene, Maze.WIDTH / 2, Maze.HEIGHT / 2 + 2, 0, 1.5);
      this.frame = Fruit.MAX_FRAMES; this.fruit = fruit % 10;
    }
    public get radius(): number { return 0.5; }
    public setConsumer(consumer: Actor): void { this.consumer = consumer; }
    public draw(): void {
      this.canvas.font = Board.getFont();
      this.canvas.textAlign = 'center';
      this.canvas.textBaseline = 'middle';
      this.canvas.fillStyle = 'lime';
      this.canvas.fillText(Fruit.ICONS[this.fruit], 0, 0);
    }
    protected get hitTargets(): Array<Sprite> { return [this.consumer]; }
    public get bonus(): number { return Fruit.SCORES[this.fruit]; }
    public tick(): void {
      super.tick();
      if (this.frame > 0) this.frame--;
      if (this.frame == 0) this.dispatchEvent('timeout');
    }
  }

  class Text extends Sprite {
    private static readonly MAX_FRAMES: number = 75;
    constructor(scene: Scene, x: number, y: number, protected readonly txt: string,
      protected readonly font: string, protected readonly color: string, size: Size = Text.mesureText(scene.canvas, txt, font))
    {
      super(scene, x, y, 0, size.w, size.h);
      this.frame = Text.MAX_FRAMES;
    }
    protected static mesureText(canvas: Canvas, txt: string, font: string): Size {
      canvas.font = font;
      return { w: canvas.measureText(txt).width, h: 1 };
    }
    public draw(): void {
      this.canvas.font = this.font;
      this.canvas.textAlign = 'center';
      this.canvas.textBaseline = 'middle';
      this.canvas.fillStyle = this.color;
      this.canvas.globalAlpha = this.frame / Text.MAX_FRAMES;
      this.canvas.fillText(this.txt, 0, 0);
    }
    public tick(): void { super.tick(); if (this.frame > 0) this.frame--; }
    public isVisible(): boolean { return this.frame > 0; }
  }

  class Bonus extends Text {
    constructor(scene: Scene, score: number, x: number, y: number) {
      super(scene, x, y, score.toString(), Board.getFont(0.9), 'white' );
    }
  }
  class Notification extends Text {
    constructor(scene: Scene, txt: string, x: number = scene.size.w / 2, y: number = scene.size.h / 2 - 4) {
      super(scene, x, y, txt, Board.getFont(), 'yellow');
    }
  }

  abstract class Actor extends Sprite {
    protected static readonly MAX_FRAMES: number = 20;
    protected static readonly DEFAULT_SPEED: number = 1 / 8;
    protected dir: Vector = { x: 0, y: 0 };
    constructor(protected readonly scene: Maze, x: number, y: number, speed: number = Actor.DEFAULT_SPEED) { super(scene, x, y, speed, 1.5); }
    public get radius(): number { return 0.5; }
    public get direction(): Readonly<Vector> { return this.dir; }
    protected isPossibleMove(dir: Vector): boolean {
      return this.scene.isWalkable(this.nextPosition(dir), dir);
    }
    protected tryDirection(dir: Vector): boolean {
      if (this.isPossibleMove(dir)) { ({ ...this.dir } = dir); return true; }
      else return false;
    }
    protected tryDirections(dir: Vector): boolean {
      let possible: boolean = this.tryDirection(dir);
      if (!possible && dir.x * dir.y != 0)
        possible = this.tryDirection({ x: 0, y: dir.y }) || this.tryDirection({ x: dir.x, y: 0 });
      return possible;
    }
    protected isMoving(): boolean { return this.dir.x != 0 || this.dir.y != 0; }
    protected reverseDirection(): void { this.dir.x = -this.dir.x; this.dir.y = -this.dir.y; this.angle += Math.PI; }
    protected chooseDirection(dir?: Vector): boolean {
      let moving: boolean = this.isMoving();
      if ((dir !== undefined && this.tryDirections(dir)) || this.tryDirections(this.dir))
        this.angle = this.orientation(this.dir); else { this.dir.x = this.dir.y = 0; }
      moving = moving || this.isMoving();
      return moving;
    }
    protected snap(): void {
      const steps = 2 * Math.round(0.5 / this.speed);
      const sx = this.dir.x == 0 ? 2 : steps;
      const sy = this.dir.y == 0 ? 2 : steps;
      if (isFinite(sx)) this.x = Math.round(sx * this.x) / sx;
      if (isFinite(sy)) this.y = Math.round(sy * this.y) / sy;
    }
    protected move(): void {
      this.frame = (this.frame + 1) % Actor.MAX_FRAMES;
      super.move();
      this.snap();
    }
    public tick(): void {
      if (this.chooseDirection()) this.move();
      super.tick();
    }
    public paint(): void {
      super.paint();
      if (this.x < 0.5) { this.x += this.scene.size.w; super.paint(); this.x -= this.scene.size.w; }
      if (this.x >= this.scene.size.w - 0.5) { this.x -= this.scene.size.w; super.paint(); this.x += this.scene.size.w; }
    }
  }

  enum State { Wait, Scatter, Chase, Frightened, Dead };

  abstract class Ghost extends Actor {
    protected static readonly SPEED: StringMap<number> = { Wait: 1 / 12, Scatter: 1 / 10, Chase: 1 / 8, Frightened: 1 / 12, Dead: 1 / 4 };
    protected static readonly TIMEOUT: StringMap<number> = { Wait: 3 * 50, Scatter: 8 * 50, Chase: 15 * 50, Frightened: 6 * 50, Dead: 3 * 50 };
    protected static readonly NEXT_CONDITION: StringMap<State> = { Wait: State.Scatter, Scatter: State.Chase, Chase: State.Scatter, Frightened: State.Scatter, Dead: State.Wait };
    protected static readonly COLORS: StringMap<string> = { Frightened: 'steelblue', FrightenedEnding: 'lightsteelblue', Eyeball: 'white', Iris: 'blue', IrisAngry: 'mediumorchid' };
    protected target: Point | undefined;
    protected state: State;
    protected stateTimeOut: number;

    constructor(protected readonly scene: Maze, protected readonly prey: Actor, protected readonly color: string, protected readonly home: Point) {
      super(scene, Maze.PEN_CENTER.x, Maze.PEN_CENTER.y);
      this.changeState(State.Wait);
      this.target = this.home;
      this.rotate = false;
    }
    public draw(): void {
      if (this.state != State.Dead) {
        this.canvas.fillStyle =
          (this.state == State.Frightened && this.stateTimeOut < 2 * 50 && this.stateTimeOut % 25 > 12) ? Ghost.COLORS.FrightenedEnding :
          (this.state == State.Frightened) ? Ghost.COLORS.Frightened : this.color;
        this.canvas.beginPath();
        this.canvas.arc(0, 0, this.size.w / 2, -Math.PI, 0);
        for (let x = 0.75; x >= -0.75; x -= 0.125)
          this.canvas.lineTo(x, 0.75 + 0.125 * Math.sin(3 * Math.PI * x + this.frame * 2 * Math.PI / Actor.MAX_FRAMES));
        this.canvas.fill();
      }
      this.canvas.translate(this.dir.x * 0.1, this.dir.y * 0.1);
      this.canvas.fillStyle = Ghost.COLORS.Eyeball;
      this.canvas.fillCircle(0.3, -0.2, 0.2);
      this.canvas.fillCircle(-0.3, -0.2, 0.2);
      this.canvas.translate(this.dir.x * 0.1, this.dir.y * 0.1);
      if (this.state == State.Frightened)
        this.canvas.translate(1 / 24 * Math.sin(this.frame * 6 * Math.PI / Actor.MAX_FRAMES), 0);
      this.canvas.fillStyle = (this.state == State.Chase) ? Ghost.COLORS.IrisAngry : Ghost.COLORS.Iris;
      this.canvas.fillCircle(0.3, -0.2, 0.1);
      this.canvas.fillCircle(-0.3, -0.2, 0.1);
    }
    public changeState(state: State) {
      if (state == State.Frightened && this.state == State.Dead) return;
      if (state == State.Frightened) this.reverseDirection();
      this.state = state;
      this.speed = Ghost.SPEED[State[state]];
      this.stateTimeOut = Ghost.TIMEOUT[State[state]];
    }
    protected isPossibleMove(dir: Vector): boolean {
      if (dir.x == -this.dir.x && dir.y == -this.dir.y) return false;
      return this.scene.isWalkable(this.nextPosition(dir), dir, this.state);
    }
    protected abstract computeChaseTarget(): Point;
    protected chooseTarget(): void {
      if (this.state == State.Dead) this.target = { x: Maze.PEN_CENTER.x, y: Maze.PEN_CENTER.y - 2 };
      else if (this.state == State.Wait) this.target = Maze.PEN_CENTER;
      else if (this.scene.isInPen(this.position)) this.target = { x: Maze.PEN_CENTER.x, y: 0 };
      else if (this.state == State.Chase) this.target = this.computeChaseTarget();
      else if (this.state == State.Scatter) this.target = this.home;
      else this.target = undefined;
    }
    protected distanceTarget({ x, y }: Vector): number {
      if (this.target == undefined) return Number.NaN;
      const p: Point = { x: this.x + 2 * x, y: this.y + 2 * y };
      return Shape.distance(this.target, p);
    }
    protected chooseDirection(dir?: Vector): boolean {
      let directions: Array<Vector> = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      directions = directions.filter((dir) => this.isPossibleMove(dir));
      if (directions.length == 0) { this.reverseDirection(); return true; }
      this.chooseTarget();
      if (this.target === undefined)
        return super.chooseDirection(directions[Math.floor(Math.random() * directions.length)]);
      if (directions.length > 1)
        directions = directions.sortBy((x) => this.distanceTarget(x));
      return super.chooseDirection(directions[0]);
    }
    protected get hitTargets(): Array<Sprite> { return [this.prey]; }
    protected checkHit(sprite: Sprite): boolean {
      if (this.state == State.Dead) return false;
      if (!super.checkHit(sprite)) return false;
      if (this.state == State.Frightened) this.changeState(State.Dead);
      return true;
    }
    public isDead(): boolean { return this.state == State.Dead; }
    public tick(): void {
      super.tick();
      if (this.state != State.Dead || this.scene.isInPen(this.position)) this.stateTimeOut--;
      if (this.stateTimeOut == 0) this.changeState(Ghost.NEXT_CONDITION[State[this.state]]);
    }
    public paintDebug(): void {
      if (this.target == undefined) return;
      this.canvas.strokeStyle = this.color;
      this.canvas.lineWidth = 1 / 6;
      this.canvas.beginPath();
      this.canvas.line(this.target.x - 0.25, this.target.y, this.target.x + 0.25, this.target.y);
      this.canvas.line(this.target.x, this.target.y - 0.25, this.target.x, this.target.y + 0.25);
      this.canvas.stroke();
      this.scene.clear({ x: this.target.x - 0.25, y: this.target.y - 0.25, w: 0.5, h: 0.5 });
    }
  }

  class Blinky extends Ghost {
    constructor(protected readonly scene: Maze, pacman: Pacman) {
      super(scene, pacman, 'red', { x: Maze.WIDTH, y: 0 });
      this.y -= 3;
      this.changeState(State.Scatter);
    }
    protected computeChaseTarget(): Point {
      return this.prey.position;
    }
  }

  class Pinky extends Ghost {
    constructor(protected readonly scene: Maze, pacman: Pacman) {
      super(scene, pacman, 'pink', { x: 0, y: 0 });
      this.stateTimeOut = 50;
    }
    protected computeChaseTarget(): Point {
      let target: Point = this.prey.position;
      const dir: Vector = this.prey.direction;
      target.x += 4 * dir.x; target.y += 4 * dir.y;
      return target;
    }
  }

  class Inky extends Ghost {
    constructor(protected readonly scene: Maze, pacman: Pacman, private blinky: Ghost) {
      super(scene, pacman, 'cyan', { x: Maze.WIDTH, y: Maze.HEIGHT });
      this.x -= 1.5;
      this.stateTimeOut = 2 * 50;
    }
    protected computeChaseTarget(): Point {
      let pivot: Point = this.prey.position;
      const dir: Vector = this.prey.direction;
      pivot.x += 2 * dir.x; pivot.y += 2 * dir.y;
      let target: Point = this.blinky.position;
      target.x = 2 * pivot.x - target.x; target.y = 2 * pivot.y - target.y;
      return target;
    }
  }

  class Clyde extends Ghost {
    constructor(protected readonly scene: Maze, pacman: Pacman) {
      super(scene, pacman, 'orange', { x: 0, y: Maze.HEIGHT });
      this.x += 1.5;
      this.stateTimeOut = 3 * 50;
    }
    protected computeChaseTarget(): Point {
      const target: Point = this.prey.position;
      const dist = (target.x - this.x) * (target.x - this.x) + (target.y - this.y) * (target.y - this.y);
      return (dist >= 64) ? target : this.home;
    }
  }

  class Pacman extends Actor {
    private static readonly SPEED: number = 1 / 8;
    private static readonly COLOR: string = 'yellow';
    private intent: Vector = { x: 0, y: 0 };
    constructor(protected readonly scene: Maze) {
      super(scene, Maze.WIDTH / 2, Maze.HEIGHT / 2 + 2, Pacman.SPEED);
    }
    public draw(): void {
      this.canvas.fillStyle = Pacman.COLOR;
      this.canvas.beginPath();
      const t: number = Math.PI / 16 + Math.PI / 8 * (1 + Math.sin(this.frame * 2 * Math.PI / Actor.MAX_FRAMES));
      this.canvas.moveTo(0, 0);
      this.canvas.arc(0, 0, this.size.w / 2, t, -t);
      this.canvas.fill();
    }
    public headFor(intent: Vector) { ({ ...this.intent } = intent); }
    protected chooseDirection(dir?: Vector): boolean {
      if (dir=== undefined) dir = { x: this.intent.x || this.dir.x, y: this.intent.y || this.dir.y };
      return super.chooseDirection(dir);
    }
    private eatDot(): void {
      const { x, y } = this.position.map(Math.floor);
      const tile: Tile | undefined = this.scene.clearDot(x, y);
      if (tile !== undefined) this.dispatchEvent('eat', tile);
    }
    public move(): void {
      super.move();
      this.eatDot();
    }
  }

  class Game {
    private static readonly SQUARE_SIZE: number = 32;
    private static readonly TICKS_PER_SECOND: number = 50;
    public static readonly MAX_LIFES: number = 3;
    private maze: Maze;
    private pacman: Pacman;
    private ghosts: Array<Ghost> = [];
    private texts: Array<Text> = [];
    private fruit: Fruit | undefined;
    private timer: number;
    protected readonly canvasElem: HTMLCanvasElement;
    protected readonly canvas: Canvas;
    private keys: StringMap<boolean> = {};
    private touchStart?: Point;
    private tileSize: number;
    private lifes: number = Game.MAX_LIFES;
    private score: number = 0;
    private level: number = 0;

    constructor(canvas: string | HTMLCanvasElement) {
      const elem: HTMLCanvasElement | null = (typeof canvas === 'string') ? document.querySelector(canvas) : canvas;
      if (elem == null) throw new Error('Canvas not found');
      const context: Canvas | null = elem.getContext('2d');
      if (context == null) throw new Error('Invalid canvas');
      this.canvasElem = elem;
      this.canvas = context;
      this.maze = new Maze(this.canvas);
      this.maze.addEventListener('cleared', (maze: Maze, all: boolean) => this.onCleared(all));
      window.addEventListener('resize', () => this.resize());
      document.body.addEventListener('click', document.body.requestFullscreen || document.body.webkitRequestFullscreen );
      this.resize();
    }
    private resize(): void {
      const size: number = Math.floor(Math.min(window.innerHeight / this.maze.size.h, window.innerWidth / this.maze.size.w, Game.SQUARE_SIZE));
      if (size != this.tileSize) {
        this.tileSize = size;
        this.canvasElem.width = this.maze.size.w * this.tileSize;
        this.canvasElem.height = this.maze.size.h * this.tileSize;
        this.maze.clear();
      }
      this.canvasElem.style.marginLeft = this.canvasElem.style.marginRight = (window.innerWidth - this.canvasElem.width) / 2 + 'px';
      this.canvasElem.style.marginTop = this.canvasElem.style.marginBottom = (window.innerHeight - this.canvasElem.height) / 2 + 'px';
    }
    private get sprites(): Array<Sprite> { return <Array<Sprite>>[this.fruit, ...this.ghosts, this.pacman, ...this.texts].filter((x) => x !== undefined); }
    public start(): void {
      window.addEventListener('keydown', (ev: KeyboardEvent) => this.onKey(ev, true));
      window.addEventListener('keyup', (ev: KeyboardEvent) => this.onKey(ev, false));
      this.canvasElem.addEventListener('touchstart', (ev: TouchEvent) => this.onTouch(ev, true), { passive: false });
      this.canvasElem.addEventListener('touchend', (ev: TouchEvent) => this.onTouch(ev, false), { passive: false });
      this.canvasElem.addEventListener('touchmove', (ev: TouchEvent) => this.onTouch(ev), { passive: false });
      this.play(true);
      window.requestAnimationFrame(() => this.paint());
      this.timer = setInterval(() => this.tick(), 1000 / Game.TICKS_PER_SECOND);
    }
    private play(newLevel: boolean = false): void {
      if (this.lifes < 0) {
        this.texts.push(new Notification(this.maze, 'GAME OVER'));
        this.lifes = Game.MAX_LIFES; this.score = 0; this.level = 1;
        delete this.fruit;
        this.maze.load();
      }
      else if (newLevel) {
        this.level++;
        delete this.fruit;
        this.maze.load();
        const fruit: string = Fruit.ICONS[(this.level - 1) % 10];
        this.texts.push(new Notification(this.maze, 'LEVEL ' + fruit));
      }
      else this.texts.push(new Notification(this.maze, 'TRY AGAIN...'));
      this.maze.setFruit(this.level - 1); this.maze.setLifes(this.lifes); this.addScore(0);
      this.pacman = new Pacman(this.maze);
      this.processKeys();
      this.pacman.addEventListener('eat', (pacman: Pacman, tile: Tile) => this.onEat(tile));
      if (this.fruit !== undefined) this.fruit.setConsumer(this.pacman);
      const blinky: Ghost = new Blinky(this.maze, this.pacman);
      this.ghosts = [blinky, new Pinky(this.maze, this.pacman), new Inky(this.maze, this.pacman, blinky), new Clyde(this.maze, this.pacman)];
      for (const ghost of this.ghosts) ghost.addEventListener('hit', (ghost: Ghost, prey: Actor) => this.onHit(ghost));
    }
    private processKeys() {
      const x: number = +('ArrowRight' in this.keys) - +('ArrowLeft' in this.keys);
      const y: number = +('ArrowDown' in this.keys) - +('ArrowUp' in this.keys);
      if (this.pacman !== undefined) this.pacman.headFor({ x, y });
    }
    private onKey(ev: KeyboardEvent, down: boolean): void {
      if (ev.key.substr(0, 5) != 'Arrow' || ev.repeat) return;
      if (down) this.keys[ev.key] = true; else delete this.keys[ev.key];
      this.processKeys();
    }
    private onTouch(ev: TouchEvent, start?: boolean): void {
      ev.preventDefault();
      if (start === false) {
        delete this.touchStart;
        this.pacman.headFor({ x: 0, y: 0 });
      }
      else if (start === true) {
        this.touchStart = { x: ev.touches[0].pageX, y: ev.touches[0].pageY };
      }
      else if (this.touchStart !== undefined) {
        let x = ev.touches[0].pageX - this.touchStart.x, y = ev.touches[0].pageY - this.touchStart.y;
        if (Math.abs(x) < 6 && Math.abs(y) < 6)
          this.pacman.headFor({ x: 0, y: 0 });
        else {
          const angle = Math.round(Math.atan2(y, x) / (Math.PI / 2)) * (Math.PI / 2);
          x = Math.round(Math.cos(angle)); y = Math.round(Math.sin(angle));
          if (this.pacman !== undefined) this.pacman.headFor({ x, y });
          this.touchStart = { x: ev.touches[0].pageX, y: ev.touches[0].pageY };
        }
      }
    }
    private addScore(value: number, pos?: Point) {
      this.score += value;
      this.maze.setStatus('SCORE', this.score.toString());
      if (pos !== undefined) this.texts.push(new Bonus(this.maze, value, pos.x, pos.y));
    }
    private onEat(tile: Tile): void {
      if (tile == Tile.Energizer) {
        for (const g of this.ghosts) g.changeState(State.Frightened);
        this.addScore(50, this.pacman.position);
      }
      else this.addScore(10);
    }
    private onCleared(all: boolean): void {
      if (all) {
        this.texts.push(new Notification(this.maze, '🏆', this.pacman.position.x, this.pacman.position.y - 0.54));
        this.addScore(100, { x: this.pacman.position.x, y: this.pacman.position.y + 0.5 });
        this.play(true);
      }
      else {
        this.fruit = new Fruit(this.maze, this.pacman, this.level - 1);
        this.fruit.addEventListener('hit', (fruit: Fruit, consumer: Sprite) => this.onHit(fruit));
        this.fruit.addEventListener('timeout', (fruit: Fruit) => delete this.fruit);
      }
    }
    private onHit(sprite: Ghost | Fruit): void {
      if (sprite instanceof Fruit) {
        this.addScore(sprite.bonus, sprite.position);
        delete this.fruit;
      }
      else if (sprite.isDead()) {
        const countDead = this.ghosts.count((g) => g.isDead());
        this.addScore(100 * (1 << countDead), sprite.position);
      }
      else {
        this.texts.push(new Notification(this.maze, '💀', this.pacman.position.x, this.pacman.position.y));
        this.lifes--;
        this.play();
      }
    }
    public paint(): void {
      this.canvas.scale(this.tileSize, this.tileSize);
      this.maze.paint();
      for (const s of this.sprites) s.paint();
      if (window.debug) for (const g of this.ghosts) g.paintDebug();
      this.canvas.resetTransform();
    }
    private tick(): void {
      this.maze.tick();
      for (const s of this.sprites) s.tick();
      this.texts = this.texts.filter((t) => t.isVisible());
      window.requestAnimationFrame(() => this.paint());
    }
    public stop(): void { clearTimeout(this.timer); }
  }
  window.addEventListener('load', () => new Game('canvas').start(), { passive: true });
}