import WatchConnectivity

class SessionDelegate: NSObject, WCSessionDelegate {
    static let shared = SessionDelegate()
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        if let type = message["type"] as? String {
            switch type {
            case "crash-detected":
                WKInterfaceDevice.current().play(.notification)
            case "sos-status":
                if let status = message["status"] as? String {
                    // Update complication if needed
                }
            default:
                break
            }
        }
    }
    
    func sessionReachabilityDidChange(_ session: WCSession) {
        NotificationCenter.default.post(name: .init("reachabilityChanged"), object: nil)
    }
}
