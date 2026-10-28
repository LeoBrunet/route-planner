import Cocoa
// Draws the app icon: forest-green tile, ochre gravel route, white start/end dots.
let out = CommandLine.arguments[1]
let sizes = [16, 32, 64, 128, 256, 512, 1024]
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
for s in sizes {
    let S = CGFloat(s)
    let img = NSImage(size: NSSize(width: S, height: S))
    img.lockFocus()
    let inset = S * 0.1, r = NSRect(x: inset, y: inset, width: S - 2*inset, height: S - 2*inset)
    let tile = NSBezierPath(roundedRect: r, xRadius: S*0.18, yRadius: S*0.18)
    NSGradient(starting: NSColor(red: 0.20, green: 0.40, blue: 0.27, alpha: 1),
               ending: NSColor(red: 0.08, green: 0.19, blue: 0.12, alpha: 1))!.draw(in: tile, angle: -90)
    // contour lines
    NSColor(white: 1, alpha: 0.08).setStroke()
    for k in 0..<5 {
        let c = NSBezierPath(ovalIn: r.insetBy(dx: S*0.06*CGFloat(k) - S*0.05, dy: S*0.05*CGFloat(k) - S*0.08).offsetBy(dx: S*0.12, dy: -S*0.1))
        c.lineWidth = max(1, S*0.008); c.stroke()
    }
    let p = NSBezierPath()
    p.move(to: NSPoint(x: S*0.25, y: S*0.27))
    p.curve(to: NSPoint(x: S*0.52, y: S*0.50), controlPoint1: NSPoint(x: S*0.55, y: S*0.22), controlPoint2: NSPoint(x: S*0.28, y: S*0.48))
    p.curve(to: NSPoint(x: S*0.75, y: S*0.73), controlPoint1: NSPoint(x: S*0.78, y: S*0.52), controlPoint2: NSPoint(x: S*0.50, y: S*0.76))
    p.lineCapStyle = .round; p.lineWidth = S*0.075
    NSColor(red: 0.95, green: 0.62, blue: 0.22, alpha: 1).setStroke(); p.stroke()
    p.lineWidth = S*0.022; p.setLineDash([S*0.04, S*0.035], count: 2, phase: 0)
    NSColor(red: 0.45, green: 0.27, blue: 0.08, alpha: 0.9).setStroke(); p.stroke()
    for (pt, col) in [(NSPoint(x: S*0.25, y: S*0.27), NSColor(red: 0.24, green: 0.86, blue: 0.52, alpha: 1)),
                      (NSPoint(x: S*0.75, y: S*0.73), NSColor(red: 1, green: 0.25, blue: 0.64, alpha: 1))] {
        let d = NSBezierPath(ovalIn: NSRect(x: pt.x - S*0.06, y: pt.y - S*0.06, width: S*0.12, height: S*0.12))
        col.setFill(); d.fill(); NSColor.white.setStroke(); d.lineWidth = S*0.02; d.stroke()
    }
    img.unlockFocus()
    let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
    let png = rep.representation(using: .png, properties: [:])!
    func name(_ n: Int, _ x2: Bool) -> String { "icon_\(n)x\(n)\(x2 ? "@2x" : "").png" }
    if s <= 512 { try! png.write(to: URL(fileURLWithPath: "\(out)/\(name(s, false))")) }
    if s >= 32 { try! png.write(to: URL(fileURLWithPath: "\(out)/\(name(s/2, true))")) }
}
