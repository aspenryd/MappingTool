using IntegrationMapper.Api.Controllers;
using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace IntegrationMapper.Tests.Controllers
{
    public class UsersControllerTests
    {
        private IntegrationMapperContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<IntegrationMapperContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new IntegrationMapperContext(options);
        }

        [Fact]
        public async Task GetUsers_ShouldReturnEmptyList_WhenNoUsers()
        {
            // Arrange
            var context = GetInMemoryContext();
            var controller = new UsersController(context);

            // Act
            var result = await controller.GetUsers();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var users = Assert.IsType<List<UserDto>>(okResult.Value);
            Assert.Empty(users);
        }

        [Fact]
        public async Task CreateUser_ShouldAddUser()
        {
            // Arrange
            var context = GetInMemoryContext();
            var controller = new UsersController(context);
            var dto = new CreateUserDto 
            { 
                Email = "test@example.com", 
                DisplayName = "Test User", 
                Role = "User" 
            };

            // Act
            var result = await controller.CreateUser(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var userDto = Assert.IsType<UserDto>(createdResult.Value);
            Assert.Equal("test@example.com", userDto.Email);
            Assert.Equal("Test User", userDto.DisplayName);
            Assert.Equal("User", userDto.Role);
            Assert.Single(context.Users);
        }

        [Fact]
        public async Task CreateUser_ShouldReturnBadRequest_WhenEmailExists()
        {
            // Arrange
            var context = GetInMemoryContext();
            context.Users.Add(new User { Email = "test@example.com", DisplayName = "Existing" });
            await context.SaveChangesAsync();

            var controller = new UsersController(context);
            var dto = new CreateUserDto 
            { 
                Email = "test@example.com", 
                DisplayName = "New User" 
            };

            // Act
            var result = await controller.CreateUser(dto);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task UpdateUserRole_ShouldChangeRole()
        {
            // Arrange
            var context = GetInMemoryContext();
            var user = new User { Email = "test@example.com", DisplayName = "Test", Role = UserRole.User };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = new UsersController(context);
            var dto = new UpdateUserRoleDto { Role = "Admin" };

            // Act
            var result = await controller.UpdateUserRole(user.PublicId, dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var userDto = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal("Admin", userDto.Role);
            
            var updatedUser = await context.Users.FirstAsync();
            Assert.Equal(UserRole.Admin, updatedUser.Role);
        }

        [Fact]
        public async Task DeleteUser_ShouldRemoveUser()
        {
            // Arrange
            var context = GetInMemoryContext();
            var user = new User { Email = "test@example.com", DisplayName = "Test" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = new UsersController(context);

            // Act
            var result = await controller.DeleteUser(user.PublicId);

            // Assert
            Assert.IsType<NoContentResult>(result);
            Assert.Empty(context.Users);
        }

        [Fact]
        public async Task GetUser_ShouldReturnNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            var context = GetInMemoryContext();
            var controller = new UsersController(context);

            // Act
            var result = await controller.GetUser(Guid.NewGuid());

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }
    }
}
