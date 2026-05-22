import SwiftUI

struct ICEInfoView: View {
    @State private var name: String = "Loading..."
    @State private var bloodGroup: String = ""
    @State private var allergies: String = ""
    @State private var medications: String = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Profile
                VStack(spacing: 4) {
                    Image(systemName: "person.circle.fill")
                        .font(.largeTitle)
                        .foregroundColor(.red)
                    Text(name)
                        .font(.headline)
                    if !bloodGroup.isEmpty {
                        Text(bloodGroup)
                            .font(.caption.weight(.bold))
                            .foregroundColor(.red)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.15))
                .cornerRadius(16)
                
                // Medical
                if !allergies.isEmpty {
                    Label(allergies, systemImage: "exclamationmark.triangle.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
                if !medications.isEmpty {
                    Label(medications, systemImage: "pill.fill")
                        .font(.caption)
                }
                
                // Emergency Call
                Button(action: {}) {
                    Label("Call 112", systemImage: "phone.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
            }
            .padding()
        }
        .onAppear {
            loadICEData()
        }
    }
    
    private func loadICEData() {
        // In production, load from shared App Group container
        let defaults = UserDefaults(suiteName: "group.roadsos")
        name = defaults?.string(forKey: "name") ?? "Unknown"
        bloodGroup = defaults?.string(forKey: "bloodGroup") ?? ""
        allergies = defaults?.string(forKey: "allergies") ?? ""
        medications = defaults?.string(forKey: "medications") ?? ""
    }
}
