var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Number.prototype.in = function (a, b) { return a <= this && this <= b; };
Object.prototype.map = function (λ) {
    var _this = this;
    return Object.keys(this).reduce(function (p, k) {
        return (__assign({}, p, (_a = {}, _a[k] = λ(_this[k]), _a)));
        var _a;
    }, {});
};
Array.prototype.includes = Array.prototype.includes || function (x) { return this.indexOf(x) >= 0; };
Array.prototype.sortBy = function (λ) { return this.sort(function (a, b) { return λ(a) - λ(b); }); };
Array.prototype.count = function (λ) { return this.reduce(function (c, x) { return c + +λ(x); }, 0); };
CanvasRenderingContext2D.prototype.resetTransform = function () { this.setTransform(1, 0, 0, 1, 0, 0); };
CanvasRenderingContext2D.prototype.circle = function (x, y, radius) { this.arc(x, y, radius, 0, 2 * Math.PI); };
CanvasRenderingContext2D.prototype.fillCircle = function (x, y, radius) { this.beginPath(); this.circle(x, y, radius); this.fill(); };
CanvasRenderingContext2D.prototype.line = function (x1, y1, x2, y2) { this.moveTo(x1, y1); this.lineTo(x2, y2); };
var Pacman;
(function (Pacman_1) {
    var EventDispatcher = (function () {
        function EventDispatcher() {
            this.listeners = {};
        }
        EventDispatcher.prototype.addEventListener = function (event, λ) {
            if (!(event in this.listeners))
                this.listeners[event] = [];
            this.listeners[event].push(λ);
        };
        EventDispatcher.prototype.dispatchEvent = function (event) {
            var x = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                x[_i - 1] = arguments[_i];
            }
            if (this.listeners[event] !== undefined)
                for (var _a = 0, _b = this.listeners[event]; _a < _b.length; _a++) {
                    var λ = _b[_a];
                    λ.apply(void 0, [this].concat(x));
                }
        };
        return EventDispatcher;
    }());
    var Shape = (function (_super) {
        __extends(Shape, _super);
        function Shape(canvas, w, h) {
            var _this = _super.call(this) || this;
            _this.canvas = canvas;
            _this.w = w;
            _this.h = h;
            return _this;
        }
        Object.defineProperty(Shape.prototype, "size", {
            get: function () { return { w: this.w, h: this.h }; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "radius", {
            get: function () { return Shape.distance({ x: this.w / 2, y: this.h / 2 }); },
            enumerable: true,
            configurable: true
        });
        Shape.prototype.tick = function () { };
        Shape.gray = function (t) { return "rgb(" + t + "," + t + "," + t + ")"; };
        Shape.distance = function (_a, p) {
            var x = _a.x, y = _a.y;
            if (p === undefined)
                return Math.sqrt(x * x + y * y);
            else
                return Shape.distance({ x: x - p.x, y: y - p.y });
        };
        return Shape;
    }(EventDispatcher));
    var Scene = (function (_super) {
        __extends(Scene, _super);
        function Scene() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Scene.prototype, "bounds", {
            get: function () { return __assign({ x: 0, y: 0 }, this.size); },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.clear = function (rect) {
            if (rect === undefined)
                this.dirty = [this.bounds];
            else
                this.dirty.push(rect);
        };
        Scene.prototype.load = function () { this.clear(); };
        Scene.prototype.paint = function () { this.dirty = []; };
        Scene.prototype.wrap = function (pos) {
            if (pos.x < 0)
                pos.x += this.w;
            else if (pos.x >= this.w)
                pos.x -= this.w;
            if (pos.y < 0)
                pos.y += this.h;
            else if (pos.y >= this.h)
                pos.y -= this.h;
        };
        return Scene;
    }(Shape));
    var Board = (function (_super) {
        __extends(Board, _super);
        function Board() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Board.prototype.load = function (source) {
            if (source === undefined)
                throw new Error('Invalid Argument');
            _super.prototype.load.call(this);
            this.tiles = Array(this.h);
            for (var j = 0; j < this.h; j++) {
                this.tiles[j] = new Uint8Array(this.w);
                for (var i = 0; i < this.w; i++)
                    this.tiles[j][i] = source(i, j);
            }
        };
        Board.getTileCenter = function (i, j) { return { x: i + 0.5, y: j + 0.5 }; };
        Board.getTileBounds = function (i, j) { return { x: i, y: j, w: 1, h: 1 }; };
        Board.prototype.getTile = function (i, j) {
            return i.in(0, this.w - 1) && j.in(0, this.h - 1) ? this.tiles[j][i] : undefined;
        };
        Board.prototype.setTile = function (i, j, tile) {
            if (this.tiles[j][i] == tile)
                return;
            this.tiles[j][i] = tile;
            this.clear(Board.getTileBounds(i, j));
        };
        Board.prototype.countTiles = function (a) {
            var count = 0;
            if (this.tiles === undefined)
                return count;
            for (var j = 0; j < this.h; j++)
                for (var i = 0; i < this.w; i++)
                    if (a.includes(this.tiles[j][i]))
                        count++;
            return count;
        };
        Board.prototype.isAnimated = function (tile) { return false; };
        Board.prototype.isDirty = function (_a, tile) {
            var x = _a.x, y = _a.y;
            return this.isAnimated(tile) ||
                this.dirty.some(function (r) { return r.x - 0.5 <= x && x < r.x + r.w + 1 && r.y - 0.5 <= y && y < r.y + r.h + 1; });
        };
        Board.prototype.getOrientation = function (tile) { return 0; };
        Board.prototype.paintTile = function (i, j) {
            var p = Board.getTileCenter(i, j);
            var tile = this.getTile(i, j);
            if (tile === undefined || !this.isDirty(p, tile))
                return;
            this.canvas.save();
            this.canvas.translate(p.x, p.y);
            this.canvas.rotate(this.getOrientation(tile) * Math.PI / 2);
            this.drawTile(tile);
            this.canvas.restore();
        };
        Board.prototype.clearTile = function (fillColor) {
            if (fillColor === undefined)
                return;
            this.canvas.fillStyle = fillColor;
            this.canvas.fillRect(-0.5, -0.5, 1, 1);
        };
        Board.getFont = function (size, bold) {
            if (size === void 0) { size = 1.1; }
            if (bold === void 0) { bold = true; }
            return (bold ? 'bold ' : '') + size + 'px Verdana, sans-serif';
        };
        Board.prototype.fillText = function (char, style, size) {
            if (size === void 0) { size = 1.1; }
            if (style === undefined)
                return;
            this.canvas.fillStyle = style;
            this.canvas.font = Board.getFont(size);
            this.canvas.textAlign = 'center';
            this.canvas.textBaseline = 'alphabetic';
            this.canvas.fillText(char, 0, 0.35);
        };
        Board.prototype.paint = function () {
            for (var j = 0; j < this.h; j++)
                for (var i = 0; i < this.w; i++)
                    this.paintTile(i, j);
            _super.prototype.paint.call(this);
        };
        return Board;
    }(Scene));
    var Tile;
    (function (Tile) {
        Tile[Tile["Empty"] = 0] = "Empty";
        Tile[Tile["Dot"] = 1] = "Dot";
        Tile[Tile["Energizer"] = 2] = "Energizer";
        Tile[Tile["Solid"] = 3] = "Solid";
        Tile[Tile["Wall"] = 4] = "Wall";
        Tile[Tile["Angle"] = 8] = "Angle";
        Tile[Tile["Corner"] = 12] = "Corner";
        Tile[Tile["Door"] = 16] = "Door";
        Tile[Tile["Fruit"] = 20] = "Fruit";
        Tile[Tile["Life"] = 31] = "Life";
        Tile[Tile["Text"] = 32] = "Text";
    })(Tile || (Tile = {}));
    var Maze = (function (_super) {
        __extends(Maze, _super);
        function Maze(canvas) {
            var _this = _super.call(this, canvas, Maze.WIDTH, Maze.HEIGHT) || this;
            _this.frame = 0;
            _this.dots = 0;
            _this.totalDots = 0;
            return _this;
        }
        Maze.prototype.load = function () {
            var hex = window.atob(Maze.BASE64_MAP).split('').map(function (c) { return ('0' + c.charCodeAt(0).toString(16)).slice(-2); }).join('');
            _super.prototype.load.call(this, function (i, j) { return '0123456789abcdef'.indexOf(hex[(Maze.HEIGHT - 1 - j) * Maze.WIDTH + i]); });
            for (var y = Maze.PEN_CENTER.y - 2.5; y <= Maze.PEN_CENTER.y - 1.5; y++)
                for (var x = Maze.PEN_CENTER.x - 1; x <= Maze.PEN_CENTER.x; x++)
                    this.tiles[y][x] += Tile.Door - Tile.Wall;
            this.totalDots = this.dots = this.countTiles([Tile.Dot, Tile.Energizer]);
        };
        Maze.prototype.getTile = function (i, j) { return _super.prototype.getTile.call(this, (i + this.w) % this.w, (j + this.h) % this.h); };
        Maze.prototype.clearDot = function (i, j) {
            var tile = this.getTile(i, j);
            if (tile != Tile.Dot && tile != Tile.Energizer)
                return undefined;
            this.setTile(i, j, Tile.Empty);
            this.dots--;
            if (this.dots == 0)
                this.dispatchEvent('cleared', true);
            else if (this.dots == Math.floor(this.totalDots / 3) || this.dots == Math.floor(2 * this.totalDots / 3))
                this.dispatchEvent('cleared', false);
            return tile;
        };
        Maze.prototype.isAnimated = function (tile) { return tile == Tile.Energizer; };
        Maze.prototype.getBaseTile = function (tile) {
            if (tile >= Tile.Text)
                return Tile.Text;
            if (tile.in(Tile.Fruit, Tile.Fruit + 9))
                return Tile.Fruit;
            var base = tile - (tile % 4);
            return [Tile.Wall, Tile.Angle, Tile.Corner, Tile.Door].includes(base) ? base : tile;
        };
        Maze.prototype.getOrientation = function (tile) {
            var base = this.getBaseTile(tile);
            return [Tile.Wall, Tile.Angle, Tile.Corner, Tile.Door].includes(base) ? tile % 4 : 0;
        };
        Maze.prototype.fillTile = function (tile, style) {
            if (style === undefined)
                return;
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
        };
        Maze.prototype.strokeTile = function (tile, style) {
            if (style === undefined)
                return;
            this.canvas.strokeStyle = style;
            this.canvas.lineWidth = Maze.SIZES.Wall;
            this.canvas.beginPath();
            if (tile == Tile.Wall || tile == Tile.Door)
                this.canvas.line(0, -0.5, 0, 0.5);
            else if (tile == Tile.Angle || tile == Tile.Corner)
                this.canvas.arc(0.5, 0.5, 0.5, -Math.PI, -Math.PI / 2);
            this.canvas.stroke();
        };
        Maze.prototype.drawTile = function (tile) {
            var base = this.getBaseTile(tile);
            this.clearTile(Maze.BG_FILLS[Tile[base]]);
            var fgFill = Maze.FG_FILLS[Tile[base]];
            if (base == Tile.Energizer)
                fgFill = Shape.gray(155 + Math.round(100 * Math.sin(this.frame * 2 * Math.PI / Maze.GLOW_FRAMES)));
            if (base == Tile.Fruit)
                this.fillText(Fruit.ICONS[tile - Tile.Fruit], fgFill, 0.9);
            else if (base == Tile.Text)
                this.fillText(String.fromCharCode(tile), fgFill);
            else
                this.fillTile(base, fgFill);
            this.strokeTile(base, Maze.FG_STROKES[Tile[base]]);
        };
        Maze.prototype.isFreeTile = function (i, j) { return this.getTile(i, j) < Tile.Solid; };
        Maze.prototype.isInPen = function (_a) {
            var x = _a.x, y = _a.y;
            return x.in(Maze.PEN_CENTER.x - 2, Maze.PEN_CENTER.x + 2) && y.in(Maze.PEN_CENTER.y - 0.5, Maze.PEN_CENTER.y + 0.5);
        };
        Maze.prototype.isWalkable = function (p, dir, state) {
            var Ԑ = 1 / 16;
            if (state !== undefined && dir !== undefined && dir.x == 0 && dir.y == (state == State.Dead ? 1 : -1) &&
                p.y >= Maze.PEN_CENTER.y - 3 - Ԑ && p.y <= Maze.PEN_CENTER.y + Ԑ && p.x >= Maze.PEN_CENTER.x - Ԑ && p.x <= Maze.PEN_CENTER.x + Ԑ)
                return true;
            var _a = p.map(Math.floor), i = _a.x, j = _a.y;
            if (!this.isFreeTile(i, j))
                return false;
            var up = this.isFreeTile(i, j - 1), down = this.isFreeTile(i, j + 1);
            var left = this.isFreeTile(i - 1, j), right = this.isFreeTile(i + 1, j);
            var x = p.x - i, y = p.y - j;
            if (left && x <= 0.5 + Ԑ && y.in(0.5 - Ԑ, 0.5 + Ԑ))
                return true;
            if (right && x >= 0.5 - Ԑ && y.in(0.5 - Ԑ, 0.5 + Ԑ))
                return true;
            if (up && y <= 0.5 + Ԑ && x.in(0.5 - Ԑ, 0.5 + Ԑ))
                return true;
            if (down && y >= 0.5 - Ԑ && x.in(0.5 - Ԑ, 0.5 + Ԑ))
                return true;
            if (dir === undefined)
                return false;
            if (left && up && dir.x == -dir.y && x <= 0.5 && y <= 0.5 && y + x >= 0.5)
                return true;
            if (right && up && dir.x == dir.y && x >= 0.5 && y <= 0.5 && y - x >= -0.5)
                return true;
            if (left && down && dir.x == dir.y && x <= 0.5 && y >= 0.5 && -y + x >= -0.5)
                return true;
            if (right && down && dir.x == -dir.y && x >= 0.5 && y >= 0.5 && -y - x >= -1.5)
                return true;
            return false;
        };
        Maze.prototype.tick = function () {
            this.frame = (this.frame + 1) % Maze.GLOW_FRAMES;
        };
        Maze.prototype.setLifes = function (n) {
            for (var i = 0; i < Game.MAX_LIFES; i++)
                this.setTile(i, Maze.HEIGHT - 1, i < n ? Tile.Life : Tile.Empty);
        };
        Maze.prototype.setFruit = function (fruit) {
            this.setTile(Maze.WIDTH - 1, Maze.HEIGHT - 1, Tile.Fruit + fruit % 10);
        };
        Maze.prototype.setStatus = function (left, right) {
            for (var i = 0; i < Maze.WIDTH; i++) {
                var value = Tile.Empty;
                if (i < left.length)
                    value = left.charCodeAt(i);
                if (right !== undefined && i >= Maze.WIDTH - right.length)
                    value = right.charCodeAt(i - Maze.WIDTH + right.length);
                this.setTile(i, 0, value);
            }
        };
        Maze.HEIGHT = 33;
        Maze.WIDTH = 28;
        Maze.BASE64_MAP = 'AAAAAAAAAAAAAAAAAAD1VVVVVVVVVVVVVVVVXmEREREREREREREREREUYbd3d3d6G6G3d3d3ehRhhVVe9VkUYYVe9VVZFGERERRhERRhERRhEREUx6G6FGG3fcd6FGG6G331kUYYkYVVVVkYkUYYXmIRRhERERABERERRhEkYbfWG3d6G6G3d6FMehRhhVkYVVkUYYVVkYVZFGERERERERRhEREREREUx3d6G6C3fcd6C6G3d30zMzYUYIVVVVkEYUMzMzMzNhRgAAAAAARhQzMzMzM2FGC3d3d6BGFDMzNVVVkYkE9VVeYIkYVVVQAAABAARgAARgABAAAAd3d6G6BMd3fWC6G3d3czMzYUYIVVVVkEYUMzMzMzNhRgAAAAAARhQzMzMzM2FMd6C6C3fWFDMzP1VVkU9VkEYIVeYYVVXmERERRhERRhERRhEREUYbd6FGG3fcd6FGG3ehRhhVkYkYVVVVkYkYVZFGEREREREREREREREREUYbd6G3d6G6G3d6G3ehRiQzYUMzYUYUMzYUM2JGGFWRhVWRRhhVWRhVkUYRERERERFGERERERERTHd3d3d3d9x3d3d3d3fQAAAAAAAAAAAAAAAAAA';
        Maze.BG_FILLS = { Empty: 'black', Dot: 'black', Energizer: 'black', Solid: 'darkblue', Wall: 'black', Angle: 'black', Corner: 'darkblue', Door: 'black', Fruit: 'black', Life: 'black', Text: 'black' };
        Maze.FG_FILLS = { Dot: 'white', Energizer: 'white', Wall: 'darkblue', Angle: 'darkblue', Corner: 'black', Door: '#23415a', Fruit: 'lime', Life: 'yellow', Text: 'white' };
        Maze.FG_STROKES = { Wall: 'blue', Angle: 'blue', Corner: 'blue', Door: 'steelblue' };
        Maze.SIZES = { Wall: 1 / 6, Dot: 1 / 8, Energizer: 2 / 5, Life: 7 / 16 };
        Maze.PEN_CENTER = { x: Maze.WIDTH / 2, y: Maze.HEIGHT / 2 - 1 };
        Maze.GLOW_FRAMES = 40;
        return Maze;
    }(Board));
    var Sprite = (function (_super) {
        __extends(Sprite, _super);
        function Sprite(scene, x, y, speed, w, h) {
            if (h === void 0) { h = w; }
            var _this = _super.call(this, scene.canvas, w, h) || this;
            _this.scene = scene;
            _this.x = x;
            _this.y = y;
            _this.speed = speed;
            _this.frame = 0;
            _this.angle = 0;
            _this.rotate = true;
            return _this;
        }
        Object.defineProperty(Sprite.prototype, "position", {
            get: function () { return { x: this.x, y: this.y }; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite.prototype, "bounds", {
            get: function () { return __assign({ x: this.x - this.w / 2, y: this.y - this.h / 2 }, this.size); },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.distance = function (sprite) { return Shape.distance(sprite.position, this.position); };
        Sprite.prototype.checkHit = function (sprite) { return this.distance(sprite) <= this.radius + sprite.radius; };
        Object.defineProperty(Sprite.prototype, "hitTargets", {
            get: function () { return []; },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.checkHits = function () {
            for (var _i = 0, _a = this.hitTargets; _i < _a.length; _i++) {
                var sprite = _a[_i];
                if (this.checkHit(sprite))
                    this.dispatchEvent('hit', sprite);
            }
        };
        Sprite.prototype.orientation = function (dir) {
            if (dir === undefined)
                return this.angle;
            if (typeof dir === 'number')
                return dir;
            return (dir.y != 0 || dir.x != 0) ? Math.atan2(dir.y, dir.x) : this.angle;
        };
        Sprite.prototype.nextPosition = function (dir) {
            var angle = this.orientation(dir);
            var pos = { x: this.x + this.speed * Math.cos(angle), y: this.y + this.speed * Math.sin(angle) };
            this.scene.wrap(pos);
            return pos;
        };
        Sprite.prototype.move = function () {
            (_a = this.nextPosition(), this.x = _a.x, this.y = _a.y);
            var _a;
        };
        Sprite.prototype.paint = function () {
            this.scene.clear(this.bounds);
            this.canvas.save();
            this.canvas.translate(this.x, this.y);
            if (this.rotate)
                this.canvas.rotate(this.angle);
            this.draw();
            this.canvas.restore();
        };
        Sprite.prototype.tick = function () {
            _super.prototype.tick.call(this);
            this.checkHits();
        };
        return Sprite;
    }(Shape));
    var Fruit = (function (_super) {
        __extends(Fruit, _super);
        function Fruit(scene, consumer, fruit) {
            var _this = _super.call(this, scene, Maze.WIDTH / 2, Maze.HEIGHT / 2 + 2, 0, 1.5) || this;
            _this.consumer = consumer;
            _this.frame = Fruit.MAX_FRAMES;
            _this.fruit = fruit % 10;
            return _this;
        }
        Object.defineProperty(Fruit.prototype, "radius", {
            get: function () { return 0.5; },
            enumerable: true,
            configurable: true
        });
        Fruit.prototype.setConsumer = function (consumer) { this.consumer = consumer; };
        Fruit.prototype.draw = function () {
            this.canvas.font = Board.getFont();
            this.canvas.textAlign = 'center';
            this.canvas.textBaseline = 'middle';
            this.canvas.fillStyle = 'lime';
            this.canvas.fillText(Fruit.ICONS[this.fruit], 0, 0);
        };
        Object.defineProperty(Fruit.prototype, "hitTargets", {
            get: function () { return [this.consumer]; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fruit.prototype, "bonus", {
            get: function () { return Fruit.SCORES[this.fruit]; },
            enumerable: true,
            configurable: true
        });
        Fruit.prototype.tick = function () {
            _super.prototype.tick.call(this);
            if (this.frame > 0)
                this.frame--;
            if (this.frame == 0)
                this.dispatchEvent('timeout');
        };
        Fruit.ICONS = '🍒 🍓 🍊 🍎 🍉 🍐 🍌 🍈 🍍 🍇'.split(' ');
        Fruit.SCORES = [100, 300, 500, 700, 1000, 2000, 3000, 5000, 7000, 10000];
        Fruit.MAX_FRAMES = 10 * 50;
        return Fruit;
    }(Sprite));
    var Text = (function (_super) {
        __extends(Text, _super);
        function Text(scene, x, y, txt, font, color, size) {
            if (size === void 0) { size = Text.mesureText(scene.canvas, txt, font); }
            var _this = _super.call(this, scene, x, y, 0, size.w, size.h) || this;
            _this.txt = txt;
            _this.font = font;
            _this.color = color;
            _this.frame = Text.MAX_FRAMES;
            return _this;
        }
        Text.mesureText = function (canvas, txt, font) {
            canvas.font = font;
            return { w: canvas.measureText(txt).width, h: 1 };
        };
        Text.prototype.draw = function () {
            this.canvas.font = this.font;
            this.canvas.textAlign = 'center';
            this.canvas.textBaseline = 'middle';
            this.canvas.fillStyle = this.color;
            this.canvas.globalAlpha = this.frame / Text.MAX_FRAMES;
            this.canvas.fillText(this.txt, 0, 0);
        };
        Text.prototype.tick = function () { _super.prototype.tick.call(this); if (this.frame > 0)
            this.frame--; };
        Text.prototype.isVisible = function () { return this.frame > 0; };
        Text.MAX_FRAMES = 75;
        return Text;
    }(Sprite));
    var Bonus = (function (_super) {
        __extends(Bonus, _super);
        function Bonus(scene, score, x, y) {
            return _super.call(this, scene, x, y, score.toString(), Board.getFont(0.9), 'white') || this;
        }
        return Bonus;
    }(Text));
    var Notification = (function (_super) {
        __extends(Notification, _super);
        function Notification(scene, txt, x, y) {
            if (x === void 0) { x = scene.size.w / 2; }
            if (y === void 0) { y = scene.size.h / 2 - 4; }
            return _super.call(this, scene, x, y, txt, Board.getFont(), 'yellow') || this;
        }
        return Notification;
    }(Text));
    var Actor = (function (_super) {
        __extends(Actor, _super);
        function Actor(scene, x, y, speed) {
            if (speed === void 0) { speed = Actor.DEFAULT_SPEED; }
            var _this = _super.call(this, scene, x, y, speed, 1.5) || this;
            _this.scene = scene;
            _this.dir = { x: 0, y: 0 };
            return _this;
        }
        Object.defineProperty(Actor.prototype, "radius", {
            get: function () { return 0.5; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Actor.prototype, "direction", {
            get: function () { return this.dir; },
            enumerable: true,
            configurable: true
        });
        Actor.prototype.isPossibleMove = function (dir) {
            return this.scene.isWalkable(this.nextPosition(dir), dir);
        };
        Actor.prototype.tryDirection = function (dir) {
            if (this.isPossibleMove(dir)) {
                (this.dir = __rest(dir, []));
                return true;
            }
            else
                return false;
        };
        Actor.prototype.tryDirections = function (dir) {
            var possible = this.tryDirection(dir);
            if (!possible && dir.x * dir.y != 0)
                possible = this.tryDirection({ x: 0, y: dir.y }) || this.tryDirection({ x: dir.x, y: 0 });
            return possible;
        };
        Actor.prototype.isMoving = function () { return this.dir.x != 0 || this.dir.y != 0; };
        Actor.prototype.reverseDirection = function () { this.dir.x = -this.dir.x; this.dir.y = -this.dir.y; this.angle += Math.PI; };
        Actor.prototype.chooseDirection = function (dir) {
            var moving = this.isMoving();
            if ((dir !== undefined && this.tryDirections(dir)) || this.tryDirections(this.dir))
                this.angle = this.orientation(this.dir);
            else {
                this.dir.x = this.dir.y = 0;
            }
            moving = moving || this.isMoving();
            return moving;
        };
        Actor.prototype.snap = function () {
            var steps = 2 * Math.round(0.5 / this.speed);
            var sx = this.dir.x == 0 ? 2 : steps;
            var sy = this.dir.y == 0 ? 2 : steps;
            if (isFinite(sx))
                this.x = Math.round(sx * this.x) / sx;
            if (isFinite(sy))
                this.y = Math.round(sy * this.y) / sy;
        };
        Actor.prototype.move = function () {
            this.frame = (this.frame + 1) % Actor.MAX_FRAMES;
            _super.prototype.move.call(this);
            this.snap();
        };
        Actor.prototype.tick = function () {
            if (this.chooseDirection())
                this.move();
            _super.prototype.tick.call(this);
        };
        Actor.prototype.paint = function () {
            _super.prototype.paint.call(this);
            if (this.x < 0.5) {
                this.x += this.scene.size.w;
                _super.prototype.paint.call(this);
                this.x -= this.scene.size.w;
            }
            if (this.x >= this.scene.size.w - 0.5) {
                this.x -= this.scene.size.w;
                _super.prototype.paint.call(this);
                this.x += this.scene.size.w;
            }
        };
        Actor.MAX_FRAMES = 20;
        Actor.DEFAULT_SPEED = 1 / 8;
        return Actor;
    }(Sprite));
    var State;
    (function (State) {
        State[State["Wait"] = 0] = "Wait";
        State[State["Scatter"] = 1] = "Scatter";
        State[State["Chase"] = 2] = "Chase";
        State[State["Frightened"] = 3] = "Frightened";
        State[State["Dead"] = 4] = "Dead";
    })(State || (State = {}));
    ;
    var Ghost = (function (_super) {
        __extends(Ghost, _super);
        function Ghost(scene, prey, color, home) {
            var _this = _super.call(this, scene, Maze.PEN_CENTER.x, Maze.PEN_CENTER.y) || this;
            _this.scene = scene;
            _this.prey = prey;
            _this.color = color;
            _this.home = home;
            _this.changeState(State.Wait);
            _this.target = _this.home;
            _this.rotate = false;
            return _this;
        }
        Ghost.prototype.draw = function () {
            if (this.state != State.Dead) {
                this.canvas.fillStyle =
                    (this.state == State.Frightened && this.stateTimeOut < 2 * 50 && this.stateTimeOut % 25 > 12) ? Ghost.COLORS.FrightenedEnding :
                        (this.state == State.Frightened) ? Ghost.COLORS.Frightened : this.color;
                this.canvas.beginPath();
                this.canvas.arc(0, 0, this.size.w / 2, -Math.PI, 0);
                for (var x = 0.75; x >= -0.75; x -= 0.125)
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
        };
        Ghost.prototype.changeState = function (state) {
            if (state == State.Frightened && this.state == State.Dead)
                return;
            if (state == State.Frightened)
                this.reverseDirection();
            this.state = state;
            this.speed = Ghost.SPEED[State[state]];
            this.stateTimeOut = Ghost.TIMEOUT[State[state]];
        };
        Ghost.prototype.isPossibleMove = function (dir) {
            if (dir.x == -this.dir.x && dir.y == -this.dir.y)
                return false;
            return this.scene.isWalkable(this.nextPosition(dir), dir, this.state);
        };
        Ghost.prototype.chooseTarget = function () {
            if (this.state == State.Dead)
                this.target = { x: Maze.PEN_CENTER.x, y: Maze.PEN_CENTER.y - 2 };
            else if (this.state == State.Wait)
                this.target = Maze.PEN_CENTER;
            else if (this.scene.isInPen(this.position))
                this.target = { x: Maze.PEN_CENTER.x, y: 0 };
            else if (this.state == State.Chase)
                this.target = this.computeChaseTarget();
            else if (this.state == State.Scatter)
                this.target = this.home;
            else
                this.target = undefined;
        };
        Ghost.prototype.distanceTarget = function (_a) {
            var x = _a.x, y = _a.y;
            if (this.target == undefined)
                return Number.NaN;
            var p = { x: this.x + 2 * x, y: this.y + 2 * y };
            return Shape.distance(this.target, p);
        };
        Ghost.prototype.chooseDirection = function (dir) {
            var _this = this;
            var directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            directions = directions.filter(function (dir) { return _this.isPossibleMove(dir); });
            if (directions.length == 0) {
                this.reverseDirection();
                return true;
            }
            this.chooseTarget();
            if (this.target === undefined)
                return _super.prototype.chooseDirection.call(this, directions[Math.floor(Math.random() * directions.length)]);
            if (directions.length > 1)
                directions = directions.sortBy(function (x) { return _this.distanceTarget(x); });
            return _super.prototype.chooseDirection.call(this, directions[0]);
        };
        Object.defineProperty(Ghost.prototype, "hitTargets", {
            get: function () { return [this.prey]; },
            enumerable: true,
            configurable: true
        });
        Ghost.prototype.checkHit = function (sprite) {
            if (this.state == State.Dead)
                return false;
            if (!_super.prototype.checkHit.call(this, sprite))
                return false;
            if (this.state == State.Frightened)
                this.changeState(State.Dead);
            return true;
        };
        Ghost.prototype.isDead = function () { return this.state == State.Dead; };
        Ghost.prototype.tick = function () {
            _super.prototype.tick.call(this);
            if (this.state != State.Dead || this.scene.isInPen(this.position))
                this.stateTimeOut--;
            if (this.stateTimeOut == 0)
                this.changeState(Ghost.NEXT_CONDITION[State[this.state]]);
        };
        Ghost.prototype.paintDebug = function () {
            if (this.target == undefined)
                return;
            this.canvas.strokeStyle = this.color;
            this.canvas.lineWidth = 1 / 6;
            this.canvas.beginPath();
            this.canvas.line(this.target.x - 0.25, this.target.y, this.target.x + 0.25, this.target.y);
            this.canvas.line(this.target.x, this.target.y - 0.25, this.target.x, this.target.y + 0.25);
            this.canvas.stroke();
            this.scene.clear({ x: this.target.x - 0.25, y: this.target.y - 0.25, w: 0.5, h: 0.5 });
        };
        Ghost.SPEED = { Wait: 1 / 12, Scatter: 1 / 10, Chase: 1 / 8, Frightened: 1 / 12, Dead: 1 / 4 };
        Ghost.TIMEOUT = { Wait: 3 * 50, Scatter: 8 * 50, Chase: 15 * 50, Frightened: 6 * 50, Dead: 3 * 50 };
        Ghost.NEXT_CONDITION = { Wait: State.Scatter, Scatter: State.Chase, Chase: State.Scatter, Frightened: State.Scatter, Dead: State.Wait };
        Ghost.COLORS = { Frightened: 'steelblue', FrightenedEnding: 'lightsteelblue', Eyeball: 'white', Iris: 'blue', IrisAngry: 'mediumorchid' };
        return Ghost;
    }(Actor));
    var Blinky = (function (_super) {
        __extends(Blinky, _super);
        function Blinky(scene, pacman) {
            var _this = _super.call(this, scene, pacman, 'red', { x: Maze.WIDTH, y: 0 }) || this;
            _this.scene = scene;
            _this.y -= 3;
            _this.changeState(State.Scatter);
            return _this;
        }
        Blinky.prototype.computeChaseTarget = function () {
            return this.prey.position;
        };
        return Blinky;
    }(Ghost));
    var Pinky = (function (_super) {
        __extends(Pinky, _super);
        function Pinky(scene, pacman) {
            var _this = _super.call(this, scene, pacman, 'pink', { x: 0, y: 0 }) || this;
            _this.scene = scene;
            _this.stateTimeOut = 50;
            return _this;
        }
        Pinky.prototype.computeChaseTarget = function () {
            var target = this.prey.position;
            var dir = this.prey.direction;
            target.x += 4 * dir.x;
            target.y += 4 * dir.y;
            return target;
        };
        return Pinky;
    }(Ghost));
    var Inky = (function (_super) {
        __extends(Inky, _super);
        function Inky(scene, pacman, blinky) {
            var _this = _super.call(this, scene, pacman, 'cyan', { x: Maze.WIDTH, y: Maze.HEIGHT }) || this;
            _this.scene = scene;
            _this.blinky = blinky;
            _this.x -= 1.5;
            _this.stateTimeOut = 2 * 50;
            return _this;
        }
        Inky.prototype.computeChaseTarget = function () {
            var pivot = this.prey.position;
            var dir = this.prey.direction;
            pivot.x += 2 * dir.x;
            pivot.y += 2 * dir.y;
            var target = this.blinky.position;
            target.x = 2 * pivot.x - target.x;
            target.y = 2 * pivot.y - target.y;
            return target;
        };
        return Inky;
    }(Ghost));
    var Clyde = (function (_super) {
        __extends(Clyde, _super);
        function Clyde(scene, pacman) {
            var _this = _super.call(this, scene, pacman, 'orange', { x: 0, y: Maze.HEIGHT }) || this;
            _this.scene = scene;
            _this.x += 1.5;
            _this.stateTimeOut = 3 * 50;
            return _this;
        }
        Clyde.prototype.computeChaseTarget = function () {
            var target = this.prey.position;
            var dist = (target.x - this.x) * (target.x - this.x) + (target.y - this.y) * (target.y - this.y);
            return (dist >= 64) ? target : this.home;
        };
        return Clyde;
    }(Ghost));
    var Pacman = (function (_super) {
        __extends(Pacman, _super);
        function Pacman(scene) {
            var _this = _super.call(this, scene, Maze.WIDTH / 2, Maze.HEIGHT / 2 + 2, Pacman.SPEED) || this;
            _this.scene = scene;
            _this.intent = { x: 0, y: 0 };
            return _this;
        }
        Pacman.prototype.draw = function () {
            this.canvas.fillStyle = Pacman.COLOR;
            this.canvas.beginPath();
            var t = Math.PI / 16 + Math.PI / 8 * (1 + Math.sin(this.frame * 2 * Math.PI / Actor.MAX_FRAMES));
            this.canvas.moveTo(0, 0);
            this.canvas.arc(0, 0, this.size.w / 2, t, -t);
            this.canvas.fill();
        };
        Pacman.prototype.headFor = function (intent) { (this.intent = __rest(intent, [])); };
        Pacman.prototype.chooseDirection = function (dir) {
            if (dir === undefined)
                dir = { x: this.intent.x || this.dir.x, y: this.intent.y || this.dir.y };
            return _super.prototype.chooseDirection.call(this, dir);
        };
        Pacman.prototype.eatDot = function () {
            var _a = this.position.map(Math.floor), x = _a.x, y = _a.y;
            var tile = this.scene.clearDot(x, y);
            if (tile !== undefined)
                this.dispatchEvent('eat', tile);
        };
        Pacman.prototype.move = function () {
            _super.prototype.move.call(this);
            this.eatDot();
        };
        Pacman.SPEED = 1 / 8;
        Pacman.COLOR = 'yellow';
        return Pacman;
    }(Actor));
    var Game = (function () {
        function Game(canvas) {
            var _this = this;
            this.ghosts = [];
            this.texts = [];
            this.keys = {};
            this.lifes = Game.MAX_LIFES;
            this.score = 0;
            this.level = 0;
            var elem = (typeof canvas === 'string') ? document.querySelector(canvas) : canvas;
            if (elem == null)
                throw new Error('Canvas not found');
            var context = elem.getContext('2d');
            if (context == null)
                throw new Error('Invalid canvas');
            this.canvasElem = elem;
            this.canvas = context;
            this.maze = new Maze(this.canvas);
            this.maze.addEventListener('cleared', function (maze, all) { return _this.onCleared(all); });
            window.addEventListener('resize', function () { return _this.resize(); });
            document.body.addEventListener('click', document.body.requestFullscreen || document.body.webkitRequestFullscreen);
            this.resize();
        }
        Game.prototype.resize = function () {
            var size = Math.floor(Math.min(window.innerHeight / this.maze.size.h, window.innerWidth / this.maze.size.w, Game.SQUARE_SIZE));
            if (size != this.tileSize) {
                this.tileSize = size;
                this.canvasElem.width = this.maze.size.w * this.tileSize;
                this.canvasElem.height = this.maze.size.h * this.tileSize;
                this.maze.clear();
            }
            this.canvasElem.style.marginLeft = this.canvasElem.style.marginRight = (window.innerWidth - this.canvasElem.width) / 2 + 'px';
            this.canvasElem.style.marginTop = this.canvasElem.style.marginBottom = (window.innerHeight - this.canvasElem.height) / 2 + 'px';
        };
        Object.defineProperty(Game.prototype, "sprites", {
            get: function () { return [this.fruit].concat(this.ghosts, [this.pacman], this.texts).filter(function (x) { return x !== undefined; }); },
            enumerable: true,
            configurable: true
        });
        Game.prototype.start = function () {
            var _this = this;
            window.addEventListener('keydown', function (ev) { return _this.onKey(ev, true); });
            window.addEventListener('keyup', function (ev) { return _this.onKey(ev, false); });
            this.canvasElem.addEventListener('touchstart', function (ev) { return _this.onTouch(ev, true); }, { passive: false });
            this.canvasElem.addEventListener('touchend', function (ev) { return _this.onTouch(ev, false); }, { passive: false });
            this.canvasElem.addEventListener('touchmove', function (ev) { return _this.onTouch(ev); }, { passive: false });
            this.play(true);
            window.requestAnimationFrame(function () { return _this.paint(); });
            this.timer = setInterval(function () { return _this.tick(); }, 1000 / Game.TICKS_PER_SECOND);
        };
        Game.prototype.play = function (newLevel) {
            var _this = this;
            if (newLevel === void 0) { newLevel = false; }
            if (this.lifes < 0) {
                this.texts.push(new Notification(this.maze, 'GAME OVER'));
                this.lifes = Game.MAX_LIFES;
                this.score = 0;
                this.level = 1;
                delete this.fruit;
                this.maze.load();
            }
            else if (newLevel) {
                this.level++;
                delete this.fruit;
                this.maze.load();
                var fruit = Fruit.ICONS[(this.level - 1) % 10];
                this.texts.push(new Notification(this.maze, 'LEVEL ' + fruit));
            }
            else
                this.texts.push(new Notification(this.maze, 'TRY AGAIN...'));
            this.maze.setFruit(this.level - 1);
            this.maze.setLifes(this.lifes);
            this.addScore(0);
            this.pacman = new Pacman(this.maze);
            this.processKeys();
            this.pacman.addEventListener('eat', function (pacman, tile) { return _this.onEat(tile); });
            if (this.fruit !== undefined)
                this.fruit.setConsumer(this.pacman);
            var blinky = new Blinky(this.maze, this.pacman);
            this.ghosts = [blinky, new Pinky(this.maze, this.pacman), new Inky(this.maze, this.pacman, blinky), new Clyde(this.maze, this.pacman)];
            for (var _i = 0, _a = this.ghosts; _i < _a.length; _i++) {
                var ghost = _a[_i];
                ghost.addEventListener('hit', function (ghost, prey) { return _this.onHit(ghost); });
            }
        };
        Game.prototype.processKeys = function () {
            var x = +('ArrowRight' in this.keys) - +('ArrowLeft' in this.keys);
            var y = +('ArrowDown' in this.keys) - +('ArrowUp' in this.keys);
            if (this.pacman !== undefined)
                this.pacman.headFor({ x: x, y: y });
        };
        Game.prototype.onKey = function (ev, down) {
            if (ev.key.substr(0, 5) != 'Arrow' || ev.repeat)
                return;
            if (down)
                this.keys[ev.key] = true;
            else
                delete this.keys[ev.key];
            this.processKeys();
        };
        Game.prototype.onTouch = function (ev, start) {
            ev.preventDefault();
            if (start === false) {
                delete this.touchStart;
                this.pacman.headFor({ x: 0, y: 0 });
            }
            else if (start === true) {
                this.touchStart = { x: ev.touches[0].pageX, y: ev.touches[0].pageY };
            }
            else if (this.touchStart !== undefined) {
                var x = ev.touches[0].pageX - this.touchStart.x, y = ev.touches[0].pageY - this.touchStart.y;
                if (Math.abs(x) < 6 && Math.abs(y) < 6)
                    this.pacman.headFor({ x: 0, y: 0 });
                else {
                    var angle = Math.round(Math.atan2(y, x) / (Math.PI / 2)) * (Math.PI / 2);
                    x = Math.round(Math.cos(angle));
                    y = Math.round(Math.sin(angle));
                    if (this.pacman !== undefined)
                        this.pacman.headFor({ x: x, y: y });
                    this.touchStart = { x: ev.touches[0].pageX, y: ev.touches[0].pageY };
                }
            }
        };
        Game.prototype.addScore = function (value, pos) {
            this.score += value;
            this.maze.setStatus('SCORE', this.score.toString());
            if (pos !== undefined)
                this.texts.push(new Bonus(this.maze, value, pos.x, pos.y));
        };
        Game.prototype.onEat = function (tile) {
            if (tile == Tile.Energizer) {
                for (var _i = 0, _a = this.ghosts; _i < _a.length; _i++) {
                    var g = _a[_i];
                    g.changeState(State.Frightened);
                }
                this.addScore(50, this.pacman.position);
            }
            else
                this.addScore(10);
        };
        Game.prototype.onCleared = function (all) {
            var _this = this;
            if (all) {
                this.texts.push(new Notification(this.maze, '🏆', this.pacman.position.x, this.pacman.position.y - 0.54));
                this.addScore(100, { x: this.pacman.position.x, y: this.pacman.position.y + 0.5 });
                this.play(true);
            }
            else {
                this.fruit = new Fruit(this.maze, this.pacman, this.level - 1);
                this.fruit.addEventListener('hit', function (fruit, consumer) { return _this.onHit(fruit); });
                this.fruit.addEventListener('timeout', function (fruit) { return delete _this.fruit; });
            }
        };
        Game.prototype.onHit = function (sprite) {
            if (sprite instanceof Fruit) {
                this.addScore(sprite.bonus, sprite.position);
                delete this.fruit;
            }
            else if (sprite.isDead()) {
                var countDead = this.ghosts.count(function (g) { return g.isDead(); });
                this.addScore(100 * (1 << countDead), sprite.position);
            }
            else {
                this.texts.push(new Notification(this.maze, '💀', this.pacman.position.x, this.pacman.position.y));
                this.lifes--;
                this.play();
            }
        };
        Game.prototype.paint = function () {
            this.canvas.scale(this.tileSize, this.tileSize);
            this.maze.paint();
            for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                var s = _a[_i];
                s.paint();
            }
            if (window.debug)
                for (var _b = 0, _c = this.ghosts; _b < _c.length; _b++) {
                    var g = _c[_b];
                    g.paintDebug();
                }
            this.canvas.resetTransform();
        };
        Game.prototype.tick = function () {
            var _this = this;
            this.maze.tick();
            for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                var s = _a[_i];
                s.tick();
            }
            this.texts = this.texts.filter(function (t) { return t.isVisible(); });
            window.requestAnimationFrame(function () { return _this.paint(); });
        };
        Game.prototype.stop = function () { clearTimeout(this.timer); };
        Game.SQUARE_SIZE = 32;
        Game.TICKS_PER_SECOND = 50;
        Game.MAX_LIFES = 3;
        return Game;
    }());
    window.addEventListener('load', function () { return new Game('canvas').start(); }, { passive: true });
})(Pacman || (Pacman = {}));
//# sourceMappingURL=app.js.map