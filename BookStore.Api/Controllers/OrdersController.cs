using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using BookStore.Api.Services;
using BookStore.Api.Models;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    int CurrentUserId() => int.Parse(User.FindFirstValue("uid")!);
    bool IsAdmin() => User.IsInRole("Admin");

    



    [Authorize(Roles = "User,Admin")]
    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
    {
        var list = await _orderService.GetMineAsync(CurrentUserId());
        return Ok(list);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> All([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _orderService.GetAllAsync(page, pageSize);
        // Mask pickup codes for admin to enforce manual entry verification
        foreach (var item in result.Items)
        {
            if (!string.IsNullOrEmpty(item.PickupCode))
                item.PickupCode = "Korumalı";
        }
        return Ok(new { Items = result.Items, TotalCount = result.TotalCount });
    }

    [Authorize(Roles = "User,Admin")]
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        try
        {
            var cancelled = await _orderService.CancelAsync(id, CurrentUserId(), IsAdmin());
            return Ok(cancelled);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid(); // Return 403 Forbidden 
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "User,Admin")]
    [HttpPost("{id}/return")]
    public async Task<IActionResult> Return(int id)
    {
        try
        {
            var returned = await _orderService.ReturnAsync(id, CurrentUserId(), IsAdmin());
            return Ok(returned);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    public record UpdateStatusRequest(OrderStatus Status);

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        var updated = await _orderService.UpdateStatusAsync(id, req.Status);
        return Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/verify-pickup")]
    public async Task<IActionResult> VerifyPickup(int id, [FromBody] string code)
    {
        var success = await _orderService.VerifyPickupCodeAsync(id, code);
        if (success) return Ok(new { message = "Kod doğrulandı, sipariş teslim edildi." });
        return BadRequest("Hatalı teslimat kodu!");
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("by-code/{code}")]
    public async Task<IActionResult> GetByPickupCode(string code)
    {
        var order = await _orderService.GetByPickupCodeAsync(code);
        if (order == null) return NotFound("Bu koda ait sipariş bulunamadı.");
        return Ok(order);
    }
}
