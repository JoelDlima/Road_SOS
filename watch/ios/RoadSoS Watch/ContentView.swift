import SwiftUI
import WatchConnectivity

struct ContentView: View {
    @State private var session = WCSession.default
    @State private var heartRate: Double = 0
    @State private var isConnected = false
    @State private var lastSOSTime: Date?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // SOS Button
                Button(action: sendSOS) {
                    VStack(spacing: 4) {
                        Text("SOS")
                            .font(.system(size: 28, weight: .heavy))
                        Text("Press to Alert")
                            .font(.system(size: 10, weight: .medium))
                            .opacity(0.7)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .background(Color.red)
                    .cornerRadius(40)
                }
                .buttonStyle(PlainButtonStyle())
                
                // Connection status
                HStack {
                    Circle()
                        .fill(isConnected ? Color.green : Color.gray)
                        .frame(width: 8, height: 8)
                    Text(isConnected ? "Phone Connected" : "Phone Disconnected")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                // Heart rate (if available)
                if heartRate > 0 {
                    VStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                            .font(.title2)
                        Text("\(Int(heartRate)) BPM")
                            .font(.title2.weight(.bold))
                    }
                    .padding()
                    .background(Color.gray.opacity(0.15))
                    .cornerRadius(12)
                }
                
                // Last SOS
                if let time = lastSOSTime {
                    VStack(spacing: 2) {
                        Text("Last SOS")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(time, style: .time)
                            .font(.caption.weight(.medium))
                    }
                    .padding(8)
                    .background(Color.red.opacity(0.15))
                    .cornerRadius(8)
                }
                
                // ICE Info button
                NavigationLink(destination: ICEInfoView()) {
                    Label("ICE Info", systemImage: "info.circle.fill")
                        .font(.caption.weight(.medium))
                }
            }
            .padding()
        }
        .onAppear {
            setupWatchConnectivity()
        }
    }
    
    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            session.delegate = SessionDelegate.shared
            session.activate()
            isConnected = session.isReachable
        }
    }
    
    private func sendSOS() {
        guard session.isReachable else { return }
        session.sendMessage(
            ["type": "sos-triggered", "source": "watch"],
            replyHandler: nil
        )
        lastSOSTime = Date()
        WKInterfaceDevice.current().play(.notification)
    }
}
