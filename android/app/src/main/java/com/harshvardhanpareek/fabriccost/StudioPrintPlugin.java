package com.harshvardhanpareek.fabriccost;
import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="StudioPrint")
public class StudioPrintPlugin extends Plugin {
  @PluginMethod public void print(PluginCall call) {
    getActivity().runOnUiThread(() -> {
      try {
        PrintManager manager=(PrintManager)getActivity().getSystemService(Context.PRINT_SERVICE);
        manager.print("fabriccost cost sheet",getBridge().getWebView().createPrintDocumentAdapter("fabriccost"),new PrintAttributes.Builder().build());
        call.resolve();
      } catch(Exception e) { call.reject("Could not open Android print",e); }
    });
  }
}
