using IntegrationMapper.Api.Controllers;
using IntegrationMapper.Core.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Moq;
using Xunit;

namespace IntegrationMapper.Tests.Controllers
{
    public class DevAuthControllerTests
    {
        [Fact]
        public void Login_ShouldReturnToken_WhenInDevMode()
        {
            // Arrange
            var mockEnv = new Mock<IWebHostEnvironment>();
            mockEnv.Setup(e => e.EnvironmentName).Returns("Development");
            
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(c => c["DevAuth:Secret"]).Returns("super-secret-key-for-testing-1234567890"); 

            var controller = new DevAuthController(mockConfig.Object, mockEnv.Object);

            // Act
            var result = controller.Login();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            
            // Check properties via reflection or dynamic since it's anonymous
            var val = okResult.Value;
            var tokenProp = val.GetType().GetProperty("token");
            Assert.NotNull(tokenProp);
            var tokenValue = tokenProp.GetValue(val);
            Assert.NotNull(tokenValue);
        }

        [Fact]
        public void Login_ShouldReturnNotFound_WhenNotInDevMode()
        {
            // Arrange
            var mockEnv = new Mock<IWebHostEnvironment>();
            mockEnv.Setup(e => e.EnvironmentName).Returns("Production");
            
            var mockConfig = new Mock<IConfiguration>();

            var controller = new DevAuthController(mockConfig.Object, mockEnv.Object);

            // Act
            var result = controller.Login();

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
    }
}
