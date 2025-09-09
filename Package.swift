// swift-tools-version:5.3

import Foundation
import PackageDescription

var sources = ["src/parser.c"]
if FileManager.default.fileExists(atPath: "src/scanner.c") {
    sources.append("src/scanner.c")
}

let package = Package(
    name: "TreeSitterVessel",
    products: [
        .library(name: "TreeSitterVessel", targets: ["TreeSitterVessel"]),
    ],
    dependencies: [
        .package(name: "SwiftTreeSitter", url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.9.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterVessel",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterVesselTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterVessel",
            ],
            path: "bindings/swift/TreeSitterVesselTests"
        )
    ],
    cLanguageStandard: .c11
)
