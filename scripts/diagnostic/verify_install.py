try:
    import torch
    import torchxrayvision as xrv
    print("SUCCESS: torchxrayvision imported successfully.")
    print(f"Torch version: {torch.__version__}")
    print(f"XRV version: {xrv.__version__}")
except ImportError as e:
    print(f"ERROR: {e}")
except Exception as e:
    print(f"ERROR: {e}")
