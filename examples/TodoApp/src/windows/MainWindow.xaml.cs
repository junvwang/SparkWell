using Microsoft.UI.Xaml;
using Windows.Graphics;

namespace TodoApp;

public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        AppWindow.Resize(new SizeInt32(960, 640));
    }
}