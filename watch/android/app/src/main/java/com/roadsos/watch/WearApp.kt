package com.roadsos.watch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material.*
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class WatchUiState {
    data object Idle : WatchUiState()
    data class Connected(val heartRate: Float = 0f) : WatchUiState()
    data class SOSSent(val timestamp: Long) : WatchUiState()
    data class Error(val message: String) : WatchUiState()
}

class WatchViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<WatchUiState>(WatchUiState.Idle)
    val uiState: StateFlow<WatchUiState> = _uiState.asStateFlow()

    private val wearableClient by lazy {
        Wearable.getMessageClient(applicationContext)
    }

    fun sendSOS() {
        viewModelScope.launch {
            _uiState.value = WatchUiState.SOSSent(System.currentTimeMillis())
            try {
                wearableClient.sendMessage("/sos-triggered", "watch".toByteArray())
            } catch (e: Exception) {
                _uiState.value = WatchUiState.Error(e.message ?: "Failed to send SOS")
            }
        }
    }

    fun connectToPhone() {
        _uiState.value = WatchUiState.Connected()
    }
}

@Composable
fun WearApp(viewModel: WatchViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    WearTheme {
        Scaffold(
            timeText = { TimeText() },
            vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) }
        ) {
            when (val state = uiState) {
                is WatchUiState.Idle -> IdleContent(
                    onSOSClick = { viewModel.sendSOS() },
                    onConnectClick = { viewModel.connectToPhone() }
                )
                is WatchUiState.Connected -> ConnectedContent(
                    heartRate = state.heartRate,
                    onSOSClick = { viewModel.sendSOS() }
                )
                is WatchUiState.SOSSent -> SOSSentContent(
                    onDismiss = { viewModel.connectToPhone() }
                )
                is WatchUiState.Error -> ErrorContent(
                    message = state.message,
                    onRetry = { viewModel.connectToPhone() }
                )
            }
        }
    }
}

@Composable
fun IdleContent(onSOSClick: () -> Unit, onConnectClick: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        SOSButton(onClick = onSOSClick)
        Button(onClick = onConnectClick) {
            Text("Connect to Phone")
        }
    }
}

@Composable
fun ConnectedContent(heartRate: Float, onSOSClick: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        SOSButton(onClick = onSOSClick)
        if (heartRate > 0) {
            Text(
                "${heartRate.toInt()} BPM",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFFF3B3B)
            )
        }
        Text("Phone Connected", fontSize = 12.sp, color = Color(0xFF34C759))
    }
}

@Composable
fun SOSSentContent(onDismiss: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("SOS Sent!", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Spacer(Modifier.height(8.dp))
        Button(onClick = onDismiss) {
            Text("OK")
        }
    }
}

@Composable
fun ErrorContent(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Error", fontWeight = FontWeight.Bold, color = Color(0xFFFF3B3B))
        Spacer(Modifier.height(4.dp))
        Text(message, fontSize = 12.sp)
        Spacer(Modifier.height(12.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}

@Composable
fun SOSButton(onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(64.dp),
        colors = ButtonDefaults.primaryButtonColors(
            containerColor = Color(0xFFFF3B3B)
        )
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("SOS", fontWeight = FontWeight.Bold, fontSize = 24.sp)
            Text("Press to Alert", fontSize = 10.sp, color = Color.White.copy(alpha = 0.7f))
        }
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { WearApp() }
    }
}
