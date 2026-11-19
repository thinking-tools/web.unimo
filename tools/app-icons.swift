// The icons of the apps in the bar's list, as this Mac shows them: 128 pixels square, PNG, with their
// transparency kept.
//
//   swiftc -O tools/app-icons.swift -o /tmp/app-icons && /tmp/app-icons assets/apps
//
// PNG, not AVIF: an icon is a shape on nothing, and not every browser reads the transparency of an AVIF that
// macOS has written. Those that do not draw the icon on black.
import AppKit

let apps: [(name: String, path: String)] = [
  ("signal", "/Applications/Signal.app"),
  ("safari", "/Applications/Safari.app"),
  ("siri", "/System/Applications/Siri.app"),
  ("script-editor", "/System/Applications/Utilities/Script Editor.app"),
  ("mission-control", "/System/Applications/Mission Control.app"),
  ("system-information", "/System/Applications/Utilities/System Information.app"),
]
let side = 128

guard CommandLine.arguments.count == 2 else {
  print("usage: app-icons <folder to write to>")
  exit(1)
}
let folder = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)

for app in apps {
  guard FileManager.default.fileExists(atPath: app.path) else {
    print("not on this Mac: \(app.path)")
    continue
  }
  let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: side, pixelsHigh: side, bitsPerSample: 8, samplesPerPixel: 4,
    hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  bitmap.size = NSSize(width: side, height: side)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
  NSGraphicsContext.current?.imageInterpolation = .high
  NSWorkspace.shared.icon(forFile: app.path)
    .draw(in: NSRect(x: 0, y: 0, width: side, height: side), from: .zero, operation: .copy, fraction: 1)
  NSGraphicsContext.restoreGraphicsState()
  let png = bitmap.representation(using: .png, properties: [:])!
  try png.write(to: folder.appendingPathComponent("\(app.name).png"))
  print("\(app.name).png: \(png.count) bytes")
}
