import XCTest
import SwiftTreeSitter
import TreeSitterVessel

final class TreeSitterVesselTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_vessel())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Vessel grammar")
    }
}
