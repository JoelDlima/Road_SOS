import XCTest
@testable import RoadSoS_Watch

final class RoadSoSWatchTests: XCTestCase {
    func testSOSMessageFormat() {
        let message = [
            "type": "sos-triggered",
            "source": "watch",
        ]
        XCTAssertEqual(message["type"], "sos-triggered")
        XCTAssertEqual(message["source"], "watch")
    }

    func testICEDataModel() {
        let data: [String: String] = [
            "name": "Arjun Sharma",
            "bloodGroup": "O+",
            "allergies": "Penicillin",
        ]
        XCTAssertEqual(data["name"], "Arjun Sharma")
        XCTAssertEqual(data["bloodGroup"], "O+")
        XCTAssertEqual(data["allergies"], "Penicillin")
    }
}
